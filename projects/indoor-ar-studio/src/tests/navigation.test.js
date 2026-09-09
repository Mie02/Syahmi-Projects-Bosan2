import { describe, it, expect } from 'vitest';
import { calculateTurnAngle, categorizeTurn, generateTurnByTurn } from '../engine/navigation.js';

describe('AR Turn-by-Turn Navigation Engine', () => {
  it('identifies straight motion when angle deviation is minimal', () => {
    const nodeA = { x: 0, y: 0 };
    const nodeB = { x: 50, y: 0 };
    const nodeC = { x: 100, y: 0 };
    const angle = calculateTurnAngle(nodeA, nodeB, nodeC);
    expect(angle).toBe(0);
    const turn = categorizeTurn(angle);
    expect(turn.action).toBe('straight');
  });

  it('identifies 90 degree right turn correctly', () => {
    const nodeA = { x: 0, y: 0 };
    const nodeB = { x: 50, y: 0 };
    const nodeC = { x: 50, y: 50 }; // going down in screen coords = +90 degrees (right turn)
    const angle = calculateTurnAngle(nodeA, nodeB, nodeC);
    expect(angle).toBe(90);
    const turn = categorizeTurn(angle);
    expect(turn.action).toBe('right');
    expect(turn.text).toBe('Turn right');
  });

  it('identifies 90 degree left turn correctly', () => {
    const nodeA = { x: 0, y: 0 };
    const nodeB = { x: 50, y: 0 };
    const nodeC = { x: 50, y: -50 }; // going up in screen coords = -90 degrees (left turn)
    const angle = calculateTurnAngle(nodeA, nodeB, nodeC);
    expect(angle).toBe(-90);
    const turn = categorizeTurn(angle);
    expect(turn.action).toBe('left');
    expect(turn.text).toBe('Turn left');
  });

  it('generates full turn-by-turn guidance for a multi-step route', () => {
    const mockPath = [
      { id: '1', name: 'Entrance', x: 0, y: 0, floor: 1, markerId: 'QR-1' },
      { id: '2', name: 'Junction', x: 100, y: 0, floor: 1 },
      { id: '3', name: 'Lab 1', x: 100, y: 100, floor: 1 },
    ];

    const instructions = generateTurnByTurn(mockPath, 20);
    expect(instructions.length).toBe(3);
    expect(instructions[0].action).toBe('start');
    expect(instructions[1].action).toBe('right');
    expect(instructions[2].action).toBe('arrive');
    expect(instructions[2].text).toContain('Lab 1');
  });

  it('includes elevator transition instructions for floor changes', () => {
    const mockPath = [
      { id: '1', name: 'Elevator F1', x: 100, y: 100, floor: 1, type: 'elevator', markerId: 'AR-ELEV-1' },
      { id: '2', name: 'Elevator F2', x: 100, y: 100, floor: 2, type: 'elevator' },
      { id: '3', name: 'Robotics Lab', x: 200, y: 100, floor: 2 },
    ];

    const instructions = generateTurnByTurn(mockPath, 20);
    const elevatorStep = instructions.find(i => i.action === 'elevator');
    expect(elevatorStep).toBeDefined();
    expect(elevatorStep.text).toContain('Floor 2');
  });
});
