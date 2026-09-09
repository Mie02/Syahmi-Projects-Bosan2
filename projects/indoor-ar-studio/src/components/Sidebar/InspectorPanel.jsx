import React from 'react';
import { Edit3, Trash2, QrCode, MapPin, Info, ArrowUpRight } from 'lucide-react';
import { NODE_TYPES } from '../../types/defaultTemplates';

export default function InspectorPanel({
  selectedNode,
  floors,
  onUpdateNode,
  onDeleteNode,
  onSetAsStart,
  onSetAsGoal,
}) {
  if (!selectedNode) {
    return (
      <div className="panel-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
        <MapPin size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          No Waypoint Selected
        </div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
          Click any waypoint on the canvas in <strong>Select</strong> mode to inspect, rename, or assign AR visual markers.
        </div>

        <div style={{ marginTop: '16px', textAlign: 'left', background: 'rgba(15,23,42,0.6)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={13} /> Canvas Shortcuts
          </div>
          <ul style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '16px', lineHeight: 1.6 }}>
            <li><strong>Scroll</strong>: Zoom in and out</li>
            <li><strong>Middle / Alt Click</strong>: Pan canvas</li>
            <li><strong>Drop Node</strong>: Click anywhere to place</li>
            <li><strong>Connect</strong>: Click 2 nodes to link corridor</li>
          </ul>
        </div>
      </div>
    );
  }

  const currentType = NODE_TYPES[selectedNode.type] || NODE_TYPES.corridor;

  return (
    <div className="panel-card">
      <div className="card-title">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Edit3 size={16} color="var(--accent-cyan)" />
          Waypoint Inspector
        </span>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => onDeleteNode(selectedNode.id)}
          title="Delete Waypoint"
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Name / Label</label>
        <input
          type="text"
          className="form-input"
          value={selectedNode.name || ''}
          onChange={(e) => onUpdateNode(selectedNode.id, { name: e.target.value })}
          placeholder="e.g. Room 101, Central Lab"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Waypoint Category</label>
        <select
          className="form-select"
          value={selectedNode.type}
          onChange={(e) => onUpdateNode(selectedNode.id, { type: e.target.value })}
        >
          {Object.entries(NODE_TYPES).map(([k, cfg]) => (
            <option key={k} value={k}>
              {cfg.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <QrCode size={13} color="var(--accent-rose)" />
          AR Anchor / Marker ID
        </label>
        <input
          type="text"
          className="form-input mono-font"
          value={selectedNode.markerId || ''}
          onChange={(e) => onUpdateNode(selectedNode.id, { markerId: e.target.value })}
          placeholder="e.g. QR-ENTRANCE-F1, AR-ROOM-101"
        />
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          Physical QR Code or Visual Image Target ID for mobile AR localization.
        </span>
      </div>

      <div className="form-group">
        <label className="form-label">Floor Assignment</label>
        <select
          className="form-select"
          value={selectedNode.floor}
          onChange={(e) => onUpdateNode(selectedNode.id, { floor: Number(e.target.value) })}
        >
          {floors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} (Floor {f.id})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <div className="metric-box">
          <div className="metric-val" style={{ fontSize: '0.9rem' }}>{Math.round(selectedNode.x)}px</div>
          <div className="metric-lbl">X Position</div>
        </div>
        <div className="metric-box">
          <div className="metric-val" style={{ fontSize: '0.9rem' }}>{Math.round(selectedNode.y)}px</div>
          <div className="metric-lbl">Y Position</div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Context Notes</label>
        <input
          type="text"
          className="form-input"
          value={selectedNode.notes || ''}
          onChange={(e) => onUpdateNode(selectedNode.id, { notes: e.target.value })}
          placeholder="e.g. Card key required, open 9am-5pm"
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          className="btn btn-sm"
          style={{ flex: 1 }}
          onClick={() => onSetAsStart(selectedNode.id)}
        >
          <ArrowUpRight size={13} color="var(--accent-emerald)" />
          Set as Start
        </button>
        <button
          className="btn btn-sm"
          style={{ flex: 1 }}
          onClick={() => onSetAsGoal(selectedNode.id)}
        >
          <MapPin size={13} color="var(--accent-rose)" />
          Set as Goal
        </button>
      </div>
    </div>
  );
}
