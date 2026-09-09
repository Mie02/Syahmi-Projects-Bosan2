import React from 'react';
import {
  MousePointer2,
  PlusCircle,
  Share2,
  ShieldAlert,
  Navigation,
  Grid,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { NODE_TYPES } from '../../types/defaultTemplates';

export default function CanvasToolbar({
  mode,
  setMode,
  selectedNodeType,
  setSelectedNodeType,
  snapToGrid,
  setSnapToGrid,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
}) {
  return (
    <div className="floating-toolbar">
      {/* Mode Buttons */}
      <button
        className={`tool-btn ${mode === 'select' ? 'active' : ''}`}
        onClick={() => setMode('select')}
        title="Select & Move: Drag and inspect waypoints"
      >
        <MousePointer2 size={15} />
        Select
      </button>

      <button
        className={`tool-btn ${mode === 'add_node' ? 'active' : ''}`}
        onClick={() => setMode('add_node')}
        title="Add Waypoint: Click canvas to drop a node"
      >
        <PlusCircle size={15} />
        Drop Node
      </button>

      {mode === 'add_node' && (
        <select
          value={selectedNodeType}
          onChange={(e) => setSelectedNodeType(e.target.value)}
          className="form-select"
          style={{ padding: '4px 8px', fontSize: '0.78rem', height: '28px', maxWidth: '140px' }}
        >
          {Object.entries(NODE_TYPES).map(([typeKey, cfg]) => (
            <option key={typeKey} value={typeKey}>
              {cfg.label}
            </option>
          ))}
        </select>
      )}

      <button
        className={`tool-btn ${mode === 'connect' ? 'active' : ''}`}
        onClick={() => setMode('connect')}
        title="Connect Corridors: Click source node, then target node"
      >
        <Share2 size={15} />
        Connect
      </button>

      <button
        className={`tool-btn ${mode === 'wall' ? 'active' : ''}`}
        onClick={() => setMode('wall')}
        title="Draw Wall / Obstacle: Click and drag to create barriers"
      >
        <ShieldAlert size={15} />
        Wall Barrier
      </button>

      <button
        className={`tool-btn ${mode === 'simulate' ? 'active' : ''}`}
        onClick={() => setMode('simulate')}
        title="AR Route Simulator: Click start, then destination"
      >
        <Navigation size={15} />
        Simulate Route
      </button>

      <div className="toolbar-divider" />

      {/* Snap to Grid */}
      <button
        className={`tool-btn ${snapToGrid ? 'active' : ''}`}
        onClick={() => setSnapToGrid(!snapToGrid)}
        title="Toggle Snap to Grid (20px / 1 meter)"
      >
        <Grid size={15} />
        Snap Grid
      </button>

      <div className="toolbar-divider" />

      {/* Zoom Controls */}
      <button className="tool-btn" onClick={onZoomOut} title="Zoom Out">
        <ZoomOut size={15} />
      </button>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '40px', textAlign: 'center' }} className="mono-font">
        {Math.round(zoom * 100)}%
      </span>
      <button className="tool-btn" onClick={onZoomIn} title="Zoom In">
        <ZoomIn size={15} />
      </button>
      <button className="tool-btn" onClick={onResetView} title="Reset Canvas View">
        <Maximize2 size={15} />
      </button>
    </div>
  );
}
