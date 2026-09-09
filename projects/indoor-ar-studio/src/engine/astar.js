// A* (A-Star) Multi-Floor Indoor Pathfinding Algorithm

/**
 * Calculates Euclidean distance in 2D space.
 */
export function calculate2DDistance(nodeA, nodeB) {
  const dx = nodeA.x - nodeB.x;
  const dy = nodeA.y - nodeB.y;
  return Math.hypot(dx, dy);
}

/**
 * Calculates real-world metric distance between two connected nodes.
 */
export function getEdgeWeight(nodeA, nodeB, edge, scale = 20, floors = []) {
  const isDifferentFloor = nodeA.floor !== nodeB.floor;
  
  if (isDifferentFloor) {
    // Inter-floor vertical cost
    const floorA = floors.find(f => f.id === nodeA.floor) || { heightMeters: (nodeA.floor - 1) * 3.5 };
    const floorB = floors.find(f => f.id === nodeB.floor) || { heightMeters: (nodeB.floor - 1) * 3.5 };
    const verticalMeters = Math.abs(floorA.heightMeters - floorB.heightMeters);
    
    // Vertical transit penalty (waiting for elevator or walking stairs)
    const transitType = edge.floorTransition || (nodeA.type === 'elevator' ? 'elevator' : 'stairs');
    const transitPenaltyMeters = transitType === 'elevator' ? 12 : 8;
    return verticalMeters + transitPenaltyMeters;
  }

  // Intra-floor 2D distance in meters
  const pixelDist = calculate2DDistance(nodeA, nodeB);
  return pixelDist / scale;
}

/**
 * A* Heuristic: Estimated remaining distance from node to goal.
 */
export function heuristic(node, goal, scale = 20, floors = []) {
  const pixelDist = calculate2DDistance(node, goal);
  const horizontalMeters = pixelDist / scale;
  
  // Height penalty if on different floors
  const floorA = floors.find(f => f.id === node.floor) || { heightMeters: (node.floor - 1) * 3.5 };
  const floorGoal = floors.find(f => f.id === goal.floor) || { heightMeters: (goal.floor - 1) * 3.5 };
  const verticalMeters = Math.abs(floorA.heightMeters - floorGoal.heightMeters);
  
  // Admissible heuristic
  return Math.sqrt(horizontalMeters * horizontalMeters + verticalMeters * verticalMeters);
}

/**
 * Finds the shortest path between startNodeId and goalNodeId using multi-floor A*.
 */
export function findShortestPath({
  startNodeId,
  goalNodeId,
  nodes,
  edges,
  scale = 20,
  floors = []
}) {
  if (!startNodeId || !goalNodeId) {
    return { success: false, error: 'Start and goal nodes must be specified.' };
  }

  if (startNodeId === goalNodeId) {
    const node = nodes.find(n => n.id === startNodeId);
    return {
      success: true,
      path: [node],
      totalDistanceMeters: 0,
      totalSteps: 0,
      estimatedSeconds: 0,
      floorTransitions: [],
    };
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const startNode = nodeMap.get(startNodeId);
  const goalNode = nodeMap.get(goalNodeId);

  if (!startNode || !goalNode) {
    return { success: false, error: 'Start or goal node not found in map.' };
  }

  // Build adjacency graph
  const adj = new Map();
  for (const node of nodes) {
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    const nA = nodeMap.get(edge.sourceId);
    const nB = nodeMap.get(edge.targetId);
    if (!nA || !nB) continue;

    const weight = getEdgeWeight(nA, nB, edge, scale, floors);
    adj.get(nA.id).push({ neighbor: nB, weight, edge });

    if (edge.bidirectional !== false) {
      adj.get(nB.id).push({ neighbor: nA, weight, edge });
    }
  }

  // A* open and closed sets
  const openSet = new Set([startNodeId]);
  const cameFrom = new Map(); // nodeId -> { fromNodeId, edge, segmentDist }

  const gScore = new Map();
  const fScore = new Map();

  for (const node of nodes) {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
  }

  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, heuristic(startNode, goalNode, scale, floors));

  while (openSet.size > 0) {
    // Pick node in openSet with lowest fScore
    let currentId = null;
    let lowestF = Infinity;

    for (const nodeId of openSet) {
      const score = fScore.get(nodeId);
      if (score < lowestF) {
        lowestF = score;
        currentId = nodeId;
      }
    }

    if (currentId === goalNodeId) {
      // Reconstruct path
      const path = [];
      const usedEdges = [];
      let curr = currentId;

      while (cameFrom.has(curr)) {
        const { fromNodeId, edge } = cameFrom.get(curr);
        path.unshift(nodeMap.get(curr));
        usedEdges.unshift(edge);
        curr = fromNodeId;
      }
      path.unshift(nodeMap.get(startNodeId));

      // Calculate total actual metric distance along path
      let totalDistanceMeters = 0;
      const floorTransitions = [];

      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const edge = usedEdges[i];

        if (u.floor !== v.floor) {
          const type = edge?.floorTransition || (u.type === 'elevator' ? 'elevator' : 'stairs');
          floorTransitions.push({
            fromFloor: u.floor,
            toFloor: v.floor,
            type,
            atNode: u,
          });
          const floorA = floors.find(f => f.id === u.floor) || { heightMeters: 0 };
          const floorB = floors.find(f => f.id === v.floor) || { heightMeters: 3.5 };
          totalDistanceMeters += Math.abs(floorA.heightMeters - floorB.heightMeters) + (type === 'elevator' ? 5 : 8);
        } else {
          totalDistanceMeters += calculate2DDistance(u, v) / scale;
        }
      }

      // Average walking speed: 1.2 m/s, Average human step length: 0.75m (~1.33 steps/m)
      const totalSteps = Math.round(totalDistanceMeters * 1.33);
      const estimatedSeconds = Math.round(totalDistanceMeters / 1.2);

      return {
        success: true,
        path,
        usedEdges,
        totalDistanceMeters: Math.round(totalDistanceMeters * 10) / 10,
        totalSteps,
        estimatedSeconds,
        floorTransitions,
      };
    }

    openSet.delete(currentId);
    const currentNode = nodeMap.get(currentId);
    const neighbors = adj.get(currentId) || [];

    for (const { neighbor, weight, edge } of neighbors) {
      const tentativeG = gScore.get(currentId) + weight;

      if (tentativeG < gScore.get(neighbor.id)) {
        cameFrom.set(neighbor.id, { fromNodeId: currentId, edge });
        gScore.set(neighbor.id, tentativeG);
        fScore.set(neighbor.id, tentativeG + heuristic(neighbor, goalNode, scale, floors));
        openSet.add(neighbor.id);
      }
    }
  }

  return {
    success: false,
    error: 'No accessible indoor path found between the selected waypoints.',
  };
}
