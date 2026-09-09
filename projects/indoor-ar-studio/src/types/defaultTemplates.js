// Default Templates for Indoor Route & AR Waypoint Studio

export const NODE_TYPES = {
  room: { label: 'Room / Office', color: '#38bdf8', icon: 'DoorOpen' },
  corridor: { label: 'Corridor Waypoint', color: '#94a3b8', icon: 'Milestone' },
  elevator: { label: 'Elevator', color: '#a855f7', icon: 'ChevronsUpDown' },
  stairs: { label: 'Stairs', color: '#f59e0b', icon: 'Footprints' },
  entrance: { label: 'Building Entrance', color: '#10b981', icon: 'LogIn' },
  ar_anchor: { label: 'AR Visual Anchor', color: '#ec4899', icon: 'QrCode' },
};

export const UNIVERSITY_TEMPLATE = {
  buildingName: 'University Faculty of Computing',
  scale: 20, // 20 pixels = 1 meter
  floors: [
    { id: 1, name: 'Floor 1 (Ground)', heightMeters: 0 },
    { id: 2, name: 'Floor 2 (Labs & Offices)', heightMeters: 4 },
  ],
  nodes: [
    // --- Floor 1 Nodes ---
    { id: 'f1_ent', name: 'Main South Entrance', type: 'entrance', x: 120, y: 320, floor: 1, markerId: 'QR-ENTRANCE-F1', notes: 'Main double-glass entrance' },
    { id: 'f1_c1', name: 'South Hallway Hub', type: 'corridor', x: 240, y: 320, floor: 1 },
    { id: 'f1_rec', name: 'Information & Reception', type: 'room', x: 240, y: 200, floor: 1, markerId: 'AR-INFO-DESK' },
    { id: 'f1_c2', name: 'Central Atrium Corridor', type: 'corridor', x: 420, y: 320, floor: 1, markerId: 'AR-ATRIUM-F1' },
    { id: 'f1_lh101', name: 'Lecture Hall 101', type: 'room', x: 420, y: 160, floor: 1, notes: 'Capacity: 120 pax' },
    { id: 'f1_c3', name: 'East Wing Junction', type: 'corridor', x: 600, y: 320, floor: 1 },
    { id: 'f1_laba', name: 'Advanced Software Lab', type: 'room', x: 600, y: 160, floor: 1, markerId: 'AR-LAB-A' },
    { id: 'f1_rest', name: 'Restrooms & Facilities', type: 'room', x: 600, y: 460, floor: 1 },
    { id: 'f1_elev', name: 'Main Passenger Elevator', type: 'elevator', x: 420, y: 460, floor: 1, markerId: 'AR-ELEV-F1' },
    { id: 'f1_stair', name: 'Central Stairwell', type: 'stairs', x: 300, y: 460, floor: 1, markerId: 'AR-STAIR-F1' },
    { id: 'f1_cafe', name: 'Cyber Cafe & Lounge', type: 'room', x: 120, y: 460, floor: 1 },

    // --- Floor 2 Nodes ---
    { id: 'f2_elev', name: 'Main Passenger Elevator', type: 'elevator', x: 420, y: 460, floor: 2, markerId: 'AR-ELEV-F2' },
    { id: 'f2_stair', name: 'Central Stairwell', type: 'stairs', x: 300, y: 460, floor: 2, markerId: 'AR-STAIR-F2' },
    { id: 'f2_c2', name: 'Floor 2 Central Hall', type: 'corridor', x: 420, y: 320, floor: 2, markerId: 'AR-LOBBY-F2' },
    { id: 'f2_ai_lab', name: 'Autonomous & Robotics Lab', type: 'room', x: 420, y: 160, floor: 2, markerId: 'AR-ROBOTICS-F2' },
    { id: 'f2_c3', name: 'East Research Corridor', type: 'corridor', x: 600, y: 320, floor: 2 },
    { id: 'f2_server', name: 'Data Center & Server Room', type: 'room', x: 600, y: 160, floor: 2 },
    { id: 'f2_conf', name: 'Executive Conference Room', type: 'room', x: 600, y: 460, floor: 2 },
    { id: 'f2_c1', name: 'West Faculty Corridor', type: 'corridor', x: 240, y: 320, floor: 2 },
    { id: 'f2_dean', name: "Dean's Office", type: 'room', x: 120, y: 320, floor: 2, markerId: 'AR-DEAN-OFFICE' },
  ],
  edges: [
    // --- Floor 1 Edges ---
    { id: 'e1_1', sourceId: 'f1_ent', targetId: 'f1_c1', bidirectional: true },
    { id: 'e1_2', sourceId: 'f1_c1', targetId: 'f1_rec', bidirectional: true },
    { id: 'e1_3', sourceId: 'f1_c1', targetId: 'f1_c2', bidirectional: true },
    { id: 'e1_4', sourceId: 'f1_c2', targetId: 'f1_lh101', bidirectional: true },
    { id: 'e1_5', sourceId: 'f1_c2', targetId: 'f1_c3', bidirectional: true },
    { id: 'e1_6', sourceId: 'f1_c3', targetId: 'f1_laba', bidirectional: true },
    { id: 'e1_7', sourceId: 'f1_c3', targetId: 'f1_rest', bidirectional: true },
    { id: 'e1_8', sourceId: 'f1_c2', targetId: 'f1_elev', bidirectional: true },
    { id: 'e1_9', sourceId: 'f1_c1', targetId: 'f1_stair', bidirectional: true },
    { id: 'e1_10', sourceId: 'f1_stair', targetId: 'f1_elev', bidirectional: true },
    { id: 'e1_11', sourceId: 'f1_stair', targetId: 'f1_cafe', bidirectional: true },

    // --- Vertical Floor Connections ---
    { id: 'e_v_elev', sourceId: 'f1_elev', targetId: 'f2_elev', bidirectional: true, floorTransition: 'elevator' },
    { id: 'e_v_stair', sourceId: 'f1_stair', targetId: 'f2_stair', bidirectional: true, floorTransition: 'stairs' },

    // --- Floor 2 Edges ---
    { id: 'e2_1', sourceId: 'f2_elev', targetId: 'f2_c2', bidirectional: true },
    { id: 'e2_2', sourceId: 'f2_stair', targetId: 'f2_c2', bidirectional: true },
    { id: 'e2_3', sourceId: 'f2_c2', targetId: 'f2_ai_lab', bidirectional: true },
    { id: 'e2_4', sourceId: 'f2_c2', targetId: 'f2_c3', bidirectional: true },
    { id: 'e2_5', sourceId: 'f2_c3', targetId: 'f2_server', bidirectional: true },
    { id: 'e2_6', sourceId: 'f2_c3', targetId: 'f2_conf', bidirectional: true },
    { id: 'e2_7', sourceId: 'f2_c2', targetId: 'f2_c1', bidirectional: true },
    { id: 'e2_8', sourceId: 'f2_c1', targetId: 'f2_dean', bidirectional: true },
  ],
  walls: [
    // Floor 1 Walls
    { id: 'w1_1', x1: 60, y1: 100, x2: 700, y2: 100, floor: 1 },
    { id: 'w1_2', x1: 60, y1: 100, x2: 60, y2: 520, floor: 1 },
    { id: 'w1_3', x1: 60, y1: 520, x2: 700, y2: 520, floor: 1 },
    { id: 'w1_4', x1: 700, y1: 100, x2: 700, y2: 520, floor: 1 },
    { id: 'w1_5', x1: 340, y1: 100, x2: 340, y2: 240, floor: 1 },
    { id: 'w1_6', x1: 500, y1: 100, x2: 500, y2: 240, floor: 1 },

    // Floor 2 Walls
    { id: 'w2_1', x1: 60, y1: 100, x2: 700, y2: 100, floor: 2 },
    { id: 'w2_2', x1: 60, y1: 100, x2: 60, y2: 520, floor: 2 },
    { id: 'w2_3', x1: 60, y1: 520, x2: 700, y2: 520, floor: 2 },
    { id: 'w2_4', x1: 700, y1: 100, x2: 700, y2: 520, floor: 2 },
  ],
};

export const EXPO_TEMPLATE = {
  buildingName: 'International Tech Expo Center',
  scale: 25, // 25 pixels = 1 meter
  floors: [
    { id: 1, name: 'Main Exhibition Hall A', heightMeters: 0 },
  ],
  nodes: [
    { id: 'exp_west', name: 'West Gate Registration', type: 'entrance', x: 100, y: 300, floor: 1, markerId: 'QR-WEST-GATE' },
    { id: 'exp_c1', name: 'West Concourse', type: 'corridor', x: 220, y: 300, floor: 1 },
    { id: 'exp_ai_pavilion', name: 'AI & Robotics Pavilion', type: 'room', x: 220, y: 160, floor: 1, markerId: 'AR-AI-ZONE' },
    { id: 'exp_c2', name: 'Central Boulevard', type: 'corridor', x: 420, y: 300, floor: 1, markerId: 'AR-EXPO-CENTER' },
    { id: 'exp_stage', name: 'Main Keynote Stage', type: 'room', x: 420, y: 120, floor: 1, markerId: 'AR-MAIN-STAGE', notes: 'Live keynote broadcasts' },
    { id: 'exp_c3', name: 'East Concourse', type: 'corridor', x: 620, y: 300, floor: 1 },
    { id: 'exp_startup', name: 'Startup Pitch Arena', type: 'room', x: 620, y: 160, floor: 1 },
    { id: 'exp_east', name: 'East Gate Exit', type: 'entrance', x: 740, y: 300, floor: 1, markerId: 'QR-EAST-GATE' },
    { id: 'exp_food', name: 'Food Court & Networking', type: 'room', x: 220, y: 460, floor: 1 },
    { id: 'exp_vip', name: 'VIP Investor Lounge', type: 'room', x: 620, y: 460, floor: 1, markerId: 'AR-VIP-LOUNGE' },
    { id: 'exp_anchor_center', name: 'Center Plaza AR Monument', type: 'ar_anchor', x: 420, y: 420, floor: 1, markerId: 'AR-MONUMENT-3D' },
  ],
  edges: [
    { id: 'exp_e1', sourceId: 'exp_west', targetId: 'exp_c1', bidirectional: true },
    { id: 'exp_e2', sourceId: 'exp_c1', targetId: 'exp_ai_pavilion', bidirectional: true },
    { id: 'exp_e3', sourceId: 'exp_c1', targetId: 'exp_c2', bidirectional: true },
    { id: 'exp_e4', sourceId: 'exp_c2', targetId: 'exp_stage', bidirectional: true },
    { id: 'exp_e5', sourceId: 'exp_c2', targetId: 'exp_c3', bidirectional: true },
    { id: 'exp_e6', sourceId: 'exp_c3', targetId: 'exp_startup', bidirectional: true },
    { id: 'exp_e7', sourceId: 'exp_c3', targetId: 'exp_east', bidirectional: true },
    { id: 'exp_e8', sourceId: 'exp_c1', targetId: 'exp_food', bidirectional: true },
    { id: 'exp_e9', sourceId: 'exp_c3', targetId: 'exp_vip', bidirectional: true },
    { id: 'exp_e10', sourceId: 'exp_c2', targetId: 'exp_anchor_center', bidirectional: true },
    { id: 'exp_e11', sourceId: 'exp_food', targetId: 'exp_anchor_center', bidirectional: true },
    { id: 'exp_e12', sourceId: 'exp_vip', targetId: 'exp_anchor_center', bidirectional: true },
  ],
  walls: [
    { id: 'exp_w1', x1: 50, y1: 60, x2: 790, y2: 60, floor: 1 },
    { id: 'exp_w2', x1: 50, y1: 60, x2: 50, y2: 540, floor: 1 },
    { id: 'exp_w3', x1: 50, y1: 540, x2: 790, y2: 540, floor: 1 },
    { id: 'exp_w4', x1: 790, y1: 60, x2: 790, y2: 540, floor: 1 },
  ],
};
