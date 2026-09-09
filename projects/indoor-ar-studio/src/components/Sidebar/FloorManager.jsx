import React from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';

export default function FloorManager({
  floors,
  activeFloor,
  setActiveFloor,
  onAddFloor,
  onRemoveFloor,
}) {
  return (
    <div className="panel-card">
      <div className="card-title">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={16} color="var(--accent-cyan)" />
          Floor Manager
        </span>
        <button
          className="btn btn-sm"
          onClick={onAddFloor}
          title="Add a new floor level"
        >
          <Plus size={13} />
          Add Floor
        </button>
      </div>

      <div className="floor-pill-group">
        {floors.map((floor) => (
          <button
            key={floor.id}
            className={`floor-pill ${activeFloor === floor.id ? 'active' : ''}`}
            onClick={() => setActiveFloor(floor.id)}
          >
            {floor.name}
            <span style={{ fontSize: '0.68rem', opacity: 0.7 }} className="mono-font">
              ({floor.heightMeters || 0}m)
            </span>
          </button>
        ))}
      </div>

      {floors.length > 1 && (
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => onRemoveFloor(activeFloor)}
            title="Delete current floor and its items"
          >
            <Trash2 size={12} />
            Delete Active Floor
          </button>
        </div>
      )}
    </div>
  );
}
