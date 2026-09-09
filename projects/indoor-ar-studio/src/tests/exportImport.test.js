import { describe, it, expect } from 'vitest';
import { exportToMobileARSchema, importFromMobileARSchema } from '../engine/exportImport.js';
import { UNIVERSITY_TEMPLATE } from '../types/defaultTemplates.js';

describe('Mobile AR Exporter & Importer', () => {
  it('exports valid AR schema with 3D metric coordinates and AR anchors', () => {
    const exported = exportToMobileARSchema({
      buildingName: UNIVERSITY_TEMPLATE.buildingName,
      scale: UNIVERSITY_TEMPLATE.scale,
      floors: UNIVERSITY_TEMPLATE.floors,
      nodes: UNIVERSITY_TEMPLATE.nodes,
      edges: UNIVERSITY_TEMPLATE.edges,
      walls: UNIVERSITY_TEMPLATE.walls,
    });

    expect(exported.schemaVersion).toBe('2.0.0');
    expect(exported.building.name).toBe(UNIVERSITY_TEMPLATE.buildingName);
    expect(exported.waypoints.length).toBe(UNIVERSITY_TEMPLATE.nodes.length);
    expect(exported.corridors.length).toBe(UNIVERSITY_TEMPLATE.edges.length);
    
    // Check 3D coordinates calculation
    const entranceNode = exported.waypoints.find(w => w.id === 'f1_ent');
    expect(entranceNode).toBeDefined();
    expect(entranceNode.position3DMeters.x).toBe(entranceNode.position2DPx.x / UNIVERSITY_TEMPLATE.scale);
    expect(entranceNode.arAnchor.hasAnchor).toBe(true);
    expect(entranceNode.arAnchor.markerId).toBe('QR-ENTRANCE-F1');
  });

  it('imports valid AR schema and reconstructs state correctly', () => {
    const exported = exportToMobileARSchema({
      buildingName: 'Test Facility',
      scale: 20,
      floors: [{ id: 1, name: 'F1', heightMeters: 0 }],
      nodes: [{ id: 'n1', name: 'Start', type: 'entrance', x: 100, y: 100, floor: 1, markerId: 'QR-TEST' }],
      edges: [],
      walls: [],
    });

    const importResult = importFromMobileARSchema(exported);
    expect(importResult.success).toBe(true);
    expect(importResult.data.nodes.length).toBe(1);
    expect(importResult.data.nodes[0].name).toBe('Start');
    expect(importResult.data.nodes[0].markerId).toBe('QR-TEST');
  });
});
