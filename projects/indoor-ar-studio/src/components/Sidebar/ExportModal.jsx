import React, { useState } from 'react';
import { X, Copy, Check, Download, QrCode, Smartphone } from 'lucide-react';
import { triggerJsonDownload } from '../../engine/exportImport';

export default function ExportModal({ isOpen, onClose, exportData }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !exportData) return null;

  const jsonString = JSON.stringify(exportData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    triggerJsonDownload(exportData, `${exportData.building.name.toLowerCase().replace(/\s+/g, '_')}_ar_schema.json`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={20} color="var(--accent-cyan)" />
              Mobile AR Navigation Schema
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Compatible with <strong>Android ARCore</strong> & <strong>Unity AR Foundation</strong>
            </div>
          </div>
          <button className="btn btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
            <div className="metric-box">
              <div className="metric-val">{exportData.building.totalWaypoints}</div>
              <div className="metric-lbl">3D Waypoints</div>
            </div>
            <div className="metric-box">
              <div className="metric-val">{exportData.building.totalCorridors}</div>
              <div className="metric-lbl">Corridor Edges</div>
            </div>
            <div className="metric-box">
              <div className="metric-val" style={{ color: 'var(--accent-rose)' }}>{exportData.building.totalAnchors}</div>
              <div className="metric-lbl">AR Visual Anchors</div>
            </div>
          </div>

          <pre className="code-preview">{jsonString}</pre>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={handleCopy}>
            {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
            {copied ? 'Copied to Clipboard!' : 'Copy JSON'}
          </button>
          <button className="btn btn-primary" onClick={handleDownload}>
            <Download size={14} />
            Download .JSON File
          </button>
        </div>
      </div>
    </div>
  );
}
