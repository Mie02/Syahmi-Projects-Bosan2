import { describe, it, expect } from 'vitest';
import { findShortestPath, calculate2DDistance, getEdgeWeight } from '../engine/astar.js';
import { UNIVERSITY_TEMPLATE } from '../types/defaultTemplates.js';

describe('A* Pathfinding Engine', () => {
  it('calculates 2D Euclidean distance correctly', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 30, y: 40 };
    expect(calculate2DDistance(p1, p2)).toBe(50);
  });

  it('calculates intra-floor edge weight in meters based on scale', () => {
    const nodeA = { x: 0, y: 0, floor: 1 };
    const nodeB = { x: 100, y: 0, floor: 1 };
    const edge = { sourceId: 'a', targetId: 'b' };
    const weight = getEdgeWeight(nodeA, nodeB, edge, 20); // 20px = 1m -> 100px = 5m
    expect(weight).toBe(5);
  });

  it('finds direct shortest path on single floor', () => {
    const result = findShortestPath({
      startNodeId: 'f1_ent',
      goalNodeId: 'f1_lh101',
      nodes: UNIVERSITY_TEMPLATE.nodes,
      edges: UNIVERSITY_TEMPLATE.edges,
      scale: UNIVERSITY_TEMPLATE.scale,
      floors: UNIVERSITY_TEMPLATE.floors,
    });

    expect(result.success).toBe(true);
    expect(result.path.length).toBeGreaterThanOrEqual(3);
    expect(result.path[0].id).toBe('f1_ent');
    expect(result.path[result.path.length - 1].id).toBe('f1_lh101');
    expect(result.totalDistanceMeters).toBeGreaterThan(0);
    expect(result.totalSteps).toBeGreaterThan(0);
  });

  it('finds multi-floor path via elevator between Floor 1 and Floor 2', () => {
    const result = findShortestPath({
      startNodeId: 'f1_ent', // Floor 1
      goalNodeId: 'f2_ai_lab', // Floor 2
      nodes: UNIVERSITY_TEMPLATE.nodes,
      edges: UNIVERSITY_TEMPLATE.edges,
      scale: UNIVERSITY_TEMPLATE.scale,
      floors: UNIVERSITY_TEMPLATE.floors,
    });

    expect(result.success).toBe(true);
    const floorsVisited = result.path.map(n => n.floor);
    expect(floorsVisited).toContain(1);
    expect(floorsVisited).toContain(2);
    expect(result.floorTransitions.length).toBeGreaterThanOrEqual(1);
  });

  it('returns graceful error when no path exists between disconnected nodes', () => {
    const isolatedNode = { id: 'isolated', name: 'Nowhere', type: 'room', x: 999, y: 999, floor: 1 };
    const result = findShortestPath({
      startNodeId: 'f1_ent',
      goalNodeId: 'isolated',
      nodes: [...UNIVERSITY_TEMPLATE.nodes, isolatedNode],
      edges: UNIVERSITY_TEMPLATE.edges,
      scale: UNIVERSITY_TEMPLATE.scale,
      floors: UNIVERSITY_TEMPLATE.floors,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No accessible indoor path');
  });
});
