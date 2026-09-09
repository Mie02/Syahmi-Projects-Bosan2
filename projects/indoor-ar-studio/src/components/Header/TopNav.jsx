import React, { useRef } from 'react';
import { Compass, Download, Upload, RotateCcw, Building2, Layers } from 'lucide-react';
import { UNIVERSITY_TEMPLATE, EXPO_TEMPLATE } from '../../types/defaultTemplates';

export default function TopNav({
  buildingName,
  stats,
  onLoadTemplate,
  onClearMap,
  onOpenExport,
  onImportJson,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        onImportJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="top-nav">
      <div className="brand-section">
        <a
          href="../../index.html"
          className="btn btn-sm"
          style={{ textDecoration: 'none', padding: '6px 10px', marginRight: '4px' }}
          title="Back to Mie's Project Hub"
        >
          ← Hub
        </a>
        <div className="brand-logo">
          <Compass size={22} />
        </div>
        <div>
          <div className="brand-title">Indoor Route & AR Studio</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span className="brand-badge">ARCore / Unity 3D</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{buildingName}</span>
          </div>
        </div>
      </div>

      <div className="nav-actions">
        {/* Template Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn btn-sm"
            onClick={() => onLoadTemplate(UNIVERSITY_TEMPLATE)}
            title="Load University CS Faculty Multi-Floor Template"
          >
            <Building2 size={14} />
            University CS (2-Floor)
          </button>
          <button
            className="btn btn-sm"
            onClick={() => onLoadTemplate(EXPO_TEMPLATE)}
            title="Load Tech Expo Single-Floor Template"
          >
            <Layers size={14} />
            Tech Expo Hall
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Map Stats */}
        <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span style={{ background: 'rgba(15,23,42,0.8)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--accent-cyan)' }}>{stats.nodes}</strong> Waypoints
          </span>
          <span style={{ background: 'rgba(15,23,42,0.8)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--accent-blue)' }}>{stats.edges}</strong> Corridors
          </span>
          <span style={{ background: 'rgba(15,23,42,0.8)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--accent-rose)' }}>{stats.anchors}</strong> AR Anchors
          </span>
        </div>

        <div className="toolbar-divider" />

        {/* Clear & IO */}
        <button className="btn btn-sm btn-danger" onClick={onClearMap} title="Reset map to empty canvas">
          <RotateCcw size={14} />
          Clear
        </button>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json,application/json"
          onChange={handleFileChange}
        />
        <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()} title="Import JSON Map Schema">
          <Upload size={14} />
          Import
        </button>

        <button className="btn btn-sm btn-primary" onClick={onOpenExport} title="Export for Android ARCore / Unity">
          <Download size={14} />
          Export AR Schema
        </button>
      </div>
    </header>
  );
}
