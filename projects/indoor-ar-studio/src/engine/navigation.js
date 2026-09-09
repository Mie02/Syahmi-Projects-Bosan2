// Turn-by-Turn AR Navigation Instruction Generator

/**
 * Normalizes an angle in degrees to the [-180, 180] range.
 */
export function normalizeAngle(deg) {
  let angle = deg % 360;
  if (angle > 180) angle -= 360;
  if (angle < -180) angle += 360;
  return angle;
}

/**
 * Calculates the turn angle in degrees between vector (A -> B) and vector (B -> C).
 * Positive = Right turn (clockwise in screen coords), Negative = Left turn (counter-clockwise).
 */
export function calculateTurnAngle(nodeA, nodeB, nodeC) {
  const v1x = nodeB.x - nodeA.x;
  const v1y = nodeB.y - nodeA.y;
  const v2x = nodeC.x - nodeB.x;
  const v2y = nodeC.y - nodeB.y;

  const angle1 = Math.atan2(v1y, v1x) * (180 / Math.PI);
  const angle2 = Math.atan2(v2y, v2x) * (180 / Math.PI);

  return normalizeAngle(angle2 - angle1);
}

/**
 * Categorizes turn angle into AR navigation action and icon.
 */
export function categorizeTurn(angleDeg) {
  if (Math.abs(angleDeg) <= 25) {
    return { action: 'straight', text: 'Continue straight', icon: 'ArrowUp' };
  }
  if (angleDeg > 25 && angleDeg <= 65) {
    return { action: 'slight_right', text: 'Bear slightly right', icon: 'ArrowUpRight' };
  }
  if (angleDeg > 65 && angleDeg <= 125) {
    return { action: 'right', text: 'Turn right', icon: 'CornerUpRight' };
  }
  if (angleDeg > 125) {
    return { action: 'sharp_right', text: 'Make a sharp right turn', icon: 'RotateCw' };
  }
  if (angleDeg < -25 && angleDeg >= -65) {
    return { action: 'slight_left', text: 'Bear slightly left', icon: 'ArrowUpLeft' };
  }
  if (angleDeg < -65 && angleDeg >= -125) {
    return { action: 'left', text: 'Turn left', icon: 'CornerUpLeft' };
  }
  return { action: 'sharp_left', text: 'Make a sharp left turn', icon: 'RotateCcw' };
}

/**
 * Generates an ordered list of turn-by-turn guidance cues for the AR navigation UI.
 */
export function generateTurnByTurn(path, scale = 20) {
  if (!path || path.length < 1) return [];

  if (path.length === 1) {
    return [
      {
        stepIndex: 1,
        action: 'arrive',
        icon: 'MapPin',
        text: `You are already at ${path[0].name}.`,
        distanceMeters: 0,
        floor: path[0].floor,
        targetNodeName: path[0].name,
      },
    ];
  }

  const instructions = [];
  let stepIndex = 1;

  // Step 1: Departure
  if (path[0].floor !== path[1].floor) {
    const isElevator = path[0].type === 'elevator' || path[1].type === 'elevator';
    const dir = path[1].floor > path[0].floor ? 'up' : 'down';
    instructions.push({
      stepIndex: stepIndex++,
      action: isElevator ? 'elevator' : 'stairs',
      icon: isElevator ? 'ChevronsUpDown' : 'Footprints',
      text: `Take the ${isElevator ? 'elevator' : 'stairs'} ${dir} from ${path[0].name} to Floor ${path[1].floor}`,
      distanceMeters: 4,
      floor: path[0].floor,
      targetNodeName: path[1].name,
      markerId: path[0].markerId,
    });
  } else {
    const firstDist = Math.round((Math.hypot(path[1].x - path[0].x, path[1].y - path[0].y) / scale) * 10) / 10;
    instructions.push({
      stepIndex: stepIndex++,
      action: 'start',
      icon: 'Navigation',
      text: `Depart from ${path[0].name} and head toward ${path[1].name}`,
      distanceMeters: firstDist,
      floor: path[0].floor,
      targetNodeName: path[1].name,
      markerId: path[0].markerId,
    });
  }

  // Intermediate steps
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];

    // Check for floor transitions
    if (curr.floor !== next.floor) {
      const isElevator = curr.type === 'elevator';
      const dir = next.floor > curr.floor ? 'up' : 'down';
      instructions.push({
        stepIndex: stepIndex++,
        action: isElevator ? 'elevator' : 'stairs',
        icon: isElevator ? 'ChevronsUpDown' : 'Footprints',
        text: `Take the ${isElevator ? 'elevator' : 'stairs'} ${dir} to Floor ${next.floor}`,
        distanceMeters: 4,
        floor: curr.floor,
        targetNodeName: next.name,
        markerId: curr.markerId,
      });
      continue;
    }

    if (prev.floor !== curr.floor) {
      // Just arrived on new floor
      const dist = Math.round((Math.hypot(next.x - curr.x, next.y - curr.y) / scale) * 10) / 10;
      instructions.push({
        stepIndex: stepIndex++,
        action: 'straight',
        icon: 'ArrowUp',
        text: `Exit onto Floor ${curr.floor} and walk toward ${next.name}`,
        distanceMeters: dist,
        floor: curr.floor,
        targetNodeName: next.name,
        markerId: curr.markerId,
      });
      continue;
    }

    const angle = calculateTurnAngle(prev, curr, next);
    const turn = categorizeTurn(angle);
    const dist = Math.round((Math.hypot(next.x - curr.x, next.y - curr.y) / scale) * 10) / 10;

    let text = `${turn.text} at ${curr.name} toward ${next.name}`;
    if (curr.markerId) {
      text += ` (AR Anchor: ${curr.markerId})`;
    }

    instructions.push({
      stepIndex: stepIndex++,
      action: turn.action,
      icon: turn.icon,
      text,
      distanceMeters: dist,
      floor: curr.floor,
      targetNodeName: next.name,
      markerId: curr.markerId,
    });
  }

  // Final Step: Arrival
  const destination = path[path.length - 1];
  instructions.push({
    stepIndex: stepIndex++,
    action: 'arrive',
    icon: 'CheckCircle2',
    text: `Arrive at destination: ${destination.name}`,
    distanceMeters: 0,
    floor: destination.floor,
    targetNodeName: destination.name,
    markerId: destination.markerId,
  });

  return instructions;
}
