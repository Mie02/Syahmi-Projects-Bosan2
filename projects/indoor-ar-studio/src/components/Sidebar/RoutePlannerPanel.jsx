import React from 'react';
import {
  Navigation,
  Footprints,
  Clock,
  MapPin,
  Play,
  Square,
  ArrowUp,
  ArrowUpRight,
  ArrowUpLeft,
  CornerUpRight,
  CornerUpLeft,
  RotateCw,
  RotateCcw,
  ChevronsUpDown,
  CheckCircle2,
  QrCode,
} from 'lucide-react';

const ICON_MAP = {
  Navigation,
  ArrowUp,
  ArrowUpRight,
  ArrowUpLeft,
  CornerUpRight,
  CornerUpLeft,
  RotateCw,
  RotateCcw,
  ChevronsUpDown,
  Footprints,
  CheckCircle2,
  MapPin,
};

export default function RoutePlannerPanel({
  nodes,
  startNodeId,
  setStartNodeId,
  goalNodeId,
  setGoalNodeId,
  onCalculateRoute,
  activeRoute,
  routeError,
  instructions,
  isWalking,
  onToggleWalking,
  walkProgress,
}) {
  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="panel-card">
      <div className="card-title">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Navigation size={16} color="var(--accent-emerald)" />
          AR Route Navigation
        </span>
      </div>

      {/* Start Waypoint */}
      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)' }} />
          Starting Waypoint
        </label>
        <select
          className="form-select"
          value={startNodeId || ''}
          onChange={(e) => setStartNodeId(e.target.value)}
        >
          <option value="">-- Choose Origin --</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name} (Floor {n.floor})
            </option>
          ))}
        </select>
      </div>

      {/* Goal Waypoint */}
      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-rose)' }} />
          Destination
        </label>
        <select
          className="form-select"
          value={goalNodeId || ''}
          onChange={(e) => setGoalNodeId(e.target.value)}
        >
          <option value="">-- Choose Destination --</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name} (Floor {n.floor})
            </option>
          ))}
        </select>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', margin: '4px 0 12px' }}
        onClick={onCalculateRoute}
        disabled={!startNodeId || !goalNodeId}
      >
        <Navigation size={15} />
        Compute Shortest Route
      </button>

      {routeError && (
        <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)', borderRadius: '8px', padding: '10px', fontSize: '0.78rem', color: '#fda4af', marginBottom: '12px' }}>
          {routeError}
        </div>
      )}

      {/* Route Metrics */}
      {activeRoute && activeRoute.success && (
        <>
          <div className="metrics-grid">
            <div className="metric-box">
              <div className="metric-val">{activeRoute.totalDistanceMeters}m</div>
              <div className="metric-lbl">Distance</div>
            </div>
            <div className="metric-box">
              <div className="metric-val">{formatTime(activeRoute.estimatedSeconds)}</div>
              <div className="metric-lbl">Walk Time</div>
            </div>
            <div className="metric-box">
              <div className="metric-val">{activeRoute.totalSteps}</div>
              <div className="metric-lbl">Est. Steps</div>
            </div>
          </div>

          {/* Simulation Walking Player */}
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Simulate AR Walking
              </span>
              <button
                className={`btn btn-sm ${isWalking ? 'btn-danger' : 'btn-primary'}`}
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                onClick={onToggleWalking}
              >
                {isWalking ? <Square size={11} /> : <Play size={11} />}
                {isWalking ? 'Stop' : 'Walk'}
              </button>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(51,65,85,0.5)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${walkProgress * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00f0ff, #10b981)',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
          </div>

          {/* Turn-by-Turn Card List */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Turn-by-Turn Guidance ({instructions.length} steps)
            </div>

            <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
              {instructions.map((step) => {
                const IconComp = ICON_MAP[step.icon] || ArrowUp;
                return (
                  <div key={step.stepIndex} className="step-card">
                    <div className="step-badge">{step.stepIndex}</div>
                    <div className="step-content">
                      <div className="step-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconComp size={15} color="var(--accent-cyan)" />
                        {step.text}
                      </div>
                      <div className="step-meta">
                        <span>Floor {step.floor}</span>
                        {step.distanceMeters > 0 && <span>• {step.distanceMeters}m</span>}
                        {step.markerId && (
                          <span className="anchor-tag">
                            <QrCode size={11} />
                            {step.markerId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
