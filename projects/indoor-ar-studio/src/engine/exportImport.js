// Mobile AR Schema Exporter & Importer for Android ARCore / Unity

/**
 * Converts map state to a standardized JSON schema optimized for Mobile AR (Android/Unity).
 */
export function exportToMobileARSchema({
  buildingName = 'Indoor Facility',
  scale = 20, // px per meter
  floors = [],
  nodes = [],
  edges = [],
  walls = []
}) {
  const floorHeightMap = new Map(floors.map(f => [f.id, f.heightMeters || (f.id - 1) * 3.5]));

  const formattedNodes = nodes.map(node => {
    const floorHeight = floorHeightMap.get(node.floor) ?? 0;
    // Converting 2D screen coords (px) to Metric 3D Space (meters)
    // In Unity/ARCore: X is right (East), Y is Up (Floor Height), Z is forward (North)
    const xMeters = Math.round((node.x / scale) * 100) / 100;
    const zMeters = Math.round((node.y / scale) * 100) / 100;

    return {
      id: node.id,
      name: node.name,
      type: node.type,
      floorIndex: node.floor,
      position2DPx: { x: node.x, y: node.y },
      position3DMeters: {
        x: xMeters,
        y: floorHeight,
        z: zMeters,
      },
      arAnchor: node.markerId ? {
        hasAnchor: true,
        markerId: node.markerId,
        type: node.type === 'ar_anchor' ? 'VisualTarget' : 'QRCode',
      } : {
        hasAnchor: false,
      },
      notes: node.notes || '',
    };
  });

  const formattedEdges = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.sourceId);
    const targetNode = nodes.find(n => n.id === edge.targetId);
    let distanceMeters = 0;

    if (sourceNode && targetNode) {
      if (sourceNode.floor === targetNode.floor) {
        distanceMeters = Math.round((Math.hypot(targetNode.x - sourceNode.x, targetNode.y - sourceNode.y) / scale) * 10) / 10;
      } else {
        const h1 = floorHeightMap.get(sourceNode.floor) || 0;
        const h2 = floorHeightMap.get(targetNode.floor) || 0;
        distanceMeters = Math.abs(h2 - h1) + (edge.floorTransition === 'elevator' ? 5 : 8);
      }
    }

    return {
      id: edge.id,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      bidirectional: edge.bidirectional !== false,
      distanceMeters,
      floorTransition: edge.floorTransition || 'none',
    };
  });

  const formattedWalls = walls.map(w => ({
    id: w.id,
    floorIndex: w.floor,
    startMeters: { x: Math.round((w.x1 / scale) * 100) / 100, z: Math.round((w.y1 / scale) * 100) / 100 },
    endMeters: { x: Math.round((w.x2 / scale) * 100) / 100, z: Math.round((w.y2 / scale) * 100) / 100 },
  }));

  return {
    schemaVersion: '2.0.0',
    generator: 'Indoor Route & AR Waypoint Studio',
    exportedAt: new Date().toISOString(),
    building: {
      name: buildingName,
      scalePixelsPerMeter: scale,
      coordinateSystem: 'Unity/ARCore Y-Up (X=East, Y=Elevation, Z=North)',
      totalWaypoints: nodes.length,
      totalCorridors: edges.length,
      totalAnchors: nodes.filter(n => !!n.markerId).length,
    },
    floors,
    waypoints: formattedNodes,
    corridors: formattedEdges,
    obstacles: formattedWalls,
  };
}

/**
 * Validates and imports a JSON schema back into Studio state.
 */
export function importFromMobileARSchema(jsonString) {
  try {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;

    if (!data.waypoints || !Array.isArray(data.waypoints)) {
      throw new Error('Invalid format: missing "waypoints" array.');
    }

    const scale = data.building?.scalePixelsPerMeter || 20;

    const nodes = data.waypoints.map(wp => ({
      id: wp.id || `node_${Math.random().toString(36).substr(2, 9)}`,
      name: wp.name || 'Unnamed Waypoint',
      type: wp.type || 'corridor',
      x: wp.position2DPx ? wp.position2DPx.x : (wp.position3DMeters ? wp.position3DMeters.x * scale : 100),
      y: wp.position2DPx ? wp.position2DPx.y : (wp.position3DMeters ? wp.position3DMeters.z * scale : 100),
      floor: wp.floorIndex || wp.floor || 1,
      markerId: wp.arAnchor?.markerId || wp.markerId || '',
      notes: wp.notes || '',
    }));

    const edges = (data.corridors || data.edges || []).map(edge => ({
      id: edge.id || `e_${Math.random().toString(36).substr(2, 9)}`,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      bidirectional: edge.bidirectional !== false,
      floorTransition: edge.floorTransition || 'none',
    }));

    const walls = (data.obstacles || data.walls || []).map(w => ({
      id: w.id || `w_${Math.random().toString(36).substr(2, 9)}`,
      x1: w.startMeters ? w.startMeters.x * scale : (w.x1 || 0),
      y1: w.startMeters ? w.startMeters.z * scale : (w.y1 || 0),
      x2: w.endMeters ? w.endMeters.x * scale : (w.x2 || 100),
      y2: w.endMeters ? w.endMeters.z * scale : (w.y2 || 100),
      floor: w.floorIndex || w.floor || 1,
    }));

    const floors = data.floors && data.floors.length > 0
      ? data.floors
      : [{ id: 1, name: 'Floor 1', heightMeters: 0 }];

    return {
      success: true,
      data: {
        buildingName: data.building?.name || 'Imported Building',
        scale,
        floors,
        nodes,
        edges,
        walls,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to parse JSON file.',
    };
  }
}

/**
 * Triggers a browser file download of the exported JSON.
 */
export function triggerJsonDownload(data, filename = 'indoor_ar_map.json') {
  const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(jsonBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
