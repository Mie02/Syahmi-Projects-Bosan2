import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import TopNav from './components/Header/TopNav';
import CanvasToolbar from './components/Canvas/CanvasToolbar';
import BlueprintCanvas from './components/Canvas/BlueprintCanvas';
import FloorManager from './components/Sidebar/FloorManager';
import InspectorPanel from './components/Sidebar/InspectorPanel';
import RoutePlannerPanel from './components/Sidebar/RoutePlannerPanel';
import ExportModal from './components/Sidebar/ExportModal';
import { UNIVERSITY_TEMPLATE } from './types/defaultTemplates';
import { findShortestPath } from './engine/astar';
import { generateTurnByTurn } from './engine/navigation';
import { exportToMobileARSchema, importFromMobileARSchema } from './engine/exportImport';
import { Navigation, Edit3, Layers } from 'lucide-react';

export default function App() {
  // Map State
  const [buildingName, setBuildingName] = useState(UNIVERSITY_TEMPLATE.buildingName);
  const [scale, setScale] = useState(UNIVERSITY_TEMPLATE.scale);
  const [floors, setFloors] = useState(UNIVERSITY_TEMPLATE.floors);
  const [activeFloor, setActiveFloor] = useState(1);
  const [nodes, setNodes] = useState(UNIVERSITY_TEMPLATE.nodes);
  const [edges, setEdges] = useState(UNIVERSITY_TEMPLATE.edges);
  const [walls, setWalls] = useState(UNIVERSITY_TEMPLATE.walls);

  // Canvas Mode & Interaction
  const [mode, setMode] = useState('select');
  const [selectedNodeType, setSelectedNodeType] = useState('room');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState(1.1);
  const [selectedElement, setSelectedElement] = useState(null);

  // Sidebar Tab
  const [activeTab, setActiveTab] = useState('route'); // 'route' | 'inspector' | 'floors'

  // Route Planning & Navigation
  const [startNodeId, setStartNodeId] = useState('f1_ent');
  const [goalNodeId, setGoalNodeId] = useState('f2_ai_lab');
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [instructions, setInstructions] = useState([]);

  // Walking Animation
  const [isWalking, setIsWalking] = useState(false);
  const [walkProgress, setWalkProgress] = useState(0);

  // Export Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Calculate Route
  const handleCalculateRoute = useCallback(() => {
    if (!startNodeId || !goalNodeId) return;

    const result = findShortestPath({
      startNodeId,
      goalNodeId,
      nodes,
      edges,
      scale,
      floors,
    });

    if (result.success) {
      setActiveRoute(result);
      setRouteError(null);
      const turns = generateTurnByTurn(result.path, scale);
      setInstructions(turns);
      setWalkProgress(0);
      setIsWalking(false);

      // Auto switch active floor to starting node floor
      const startNode = nodes.find(n => n.id === startNodeId);
      if (startNode && startNode.floor !== activeFloor) {
        setActiveFloor(startNode.floor);
      }
    } else {
      setActiveRoute(null);
      setInstructions([]);
      setRouteError(result.error);
    }
  }, [startNodeId, goalNodeId, nodes, edges, scale, floors, activeFloor]);

  // Initial route calculation on mount
  useEffect(() => {
    handleCalculateRoute();
  }, []);

  // Walking animation loop
  useEffect(() => {
    let animFrame;
    if (isWalking) {
      const durationMs = 6000;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1.0);
        setWalkProgress(progress);

        // Auto switch canvas floor when avatar reaches vertical transition
        if (activeRoute && activeRoute.path) {
          const totalSegs = activeRoute.path.length - 1;
          const currentSegIndex = Math.min(Math.floor(progress * totalSegs), totalSegs);
          const currentNode = activeRoute.path[currentSegIndex];
          if (currentNode && currentNode.floor !== activeFloor) {
            setActiveFloor(currentNode.floor);
          }
        }

        if (progress < 1.0) {
          animFrame = requestAnimationFrame(animate);
        } else {
          setIsWalking(false);
          try {
            if (typeof confetti === 'function') {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#00f0ff', '#10b981', '#38bdf8', '#a855f7'],
              });
            }
          } catch (err) {
            console.warn('Confetti effect skipped:', err);
          }
        }
      };

      animFrame = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(animFrame);
  }, [isWalking, activeRoute, activeFloor]);

  // Template Loader
  const handleLoadTemplate = (tpl) => {
    setBuildingName(tpl.buildingName);
    setScale(tpl.scale);
    setFloors(tpl.floors);
    setActiveFloor(tpl.floors[0].id);
    setNodes(tpl.nodes);
    setEdges(tpl.edges);
    setWalls(tpl.walls);
    setSelectedElement(null);
    setStartNodeId(tpl.nodes[0]?.id || '');
    setGoalNodeId(tpl.nodes[tpl.nodes.length - 1]?.id || '');
    setActiveRoute(null);
    setInstructions([]);
  };

  // Clear Map
  const handleClearMap = () => {
    setNodes([]);
    setEdges([]);
    setWalls([]);
    setSelectedElement(null);
    setStartNodeId('');
    setGoalNodeId('');
    setActiveRoute(null);
    setInstructions([]);
  };

  // Node Mutations
  const handleAddNode = (newNodeData) => {
    const id = `node_${Date.now()}`;
    const newNode = {
      id,
      markerId: '',
      notes: '',
      ...newNodeData,
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedElement(newNode);
    setActiveTab('inspector');
  };

  const handleUpdateNodePosition = (nodeId, x, y) => {
    setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, x, y } : n)));
    if (selectedElement?.id === nodeId) {
      setSelectedElement(prev => ({ ...prev, x, y }));
    }
  };

  const handleUpdateNode = (nodeId, updates) => {
    setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, ...updates } : n)));
    if (selectedElement?.id === nodeId) {
      setSelectedElement(prev => ({ ...prev, ...updates }));
    }
  };

  const handleDeleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId));
    if (selectedElement?.id === nodeId) {
      setSelectedElement(null);
    }
    if (startNodeId === nodeId) setStartNodeId('');
    if (goalNodeId === nodeId) setGoalNodeId('');
    setActiveRoute(null);
  };

  // Edge Mutations
  const handleAddEdge = (sourceId, targetId) => {
    // Check if edge already exists
    const exists = edges.some(
      e => (e.sourceId === sourceId && e.targetId === targetId) ||
           (e.sourceId === targetId && e.targetId === sourceId)
    );
    if (exists) return;

    const nA = nodes.find(n => n.id === sourceId);
    const nB = nodes.find(n => n.id === targetId);
    const isVertical = nA?.floor !== nB?.floor;

    const newEdge = {
      id: `e_${Date.now()}`,
      sourceId,
      targetId,
      bidirectional: true,
      floorTransition: isVertical ? (nA?.type === 'elevator' ? 'elevator' : 'stairs') : 'none',
    };
    setEdges(prev => [...prev, newEdge]);
  };

  // Wall Mutations
  const handleAddWall = (newWallData) => {
    const newWall = {
      id: `wall_${Date.now()}`,
      ...newWallData,
    };
    setWalls(prev => [...prev, newWall]);
  };

  // Floor Mutations
  const handleAddFloor = () => {
    const nextId = floors.length > 0 ? Math.max(...floors.map(f => f.id)) + 1 : 1;
    const newFloor = {
      id: nextId,
      name: `Floor ${nextId}`,
      heightMeters: (nextId - 1) * 3.5,
    };
    setFloors(prev => [...prev, newFloor]);
    setActiveFloor(nextId);
  };

  const handleRemoveFloor = (floorId) => {
    if (floors.length <= 1) return;
    setFloors(prev => prev.filter(f => f.id !== floorId));
    setNodes(prev => prev.filter(n => n.floor !== floorId));
    setWalls(prev => prev.filter(w => w.floor !== floorId));
    const remaining = floors.filter(f => f.id !== floorId);
    setActiveFloor(remaining[0].id);
  };

  // Import JSON
  const handleImportJson = (jsonString) => {
    const res = importFromMobileARSchema(jsonString);
    if (res.success) {
      setBuildingName(res.data.buildingName);
      setScale(res.data.scale);
      setFloors(res.data.floors);
      setActiveFloor(res.data.floors[0].id);
      setNodes(res.data.nodes);
      setEdges(res.data.edges);
      setWalls(res.data.walls);
      setSelectedElement(null);
      setActiveRoute(null);
      setInstructions([]);
    } else {
      alert(`Import Failed: ${res.error}`);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      nodes: nodes.length,
      edges: edges.length,
      anchors: nodes.filter(n => !!n.markerId).length,
    };
  }, [nodes, edges]);

  // Export schema data
  const exportData = useMemo(() => {
    return exportToMobileARSchema({
      buildingName,
      scale,
      floors,
      nodes,
      edges,
      walls,
    });
  }, [buildingName, scale, floors, nodes, edges, walls]);

  return (
    <div className="app-container">
      {/* Top Header Navigation */}
      <TopNav
        buildingName={buildingName}
        stats={stats}
        onLoadTemplate={handleLoadTemplate}
        onClearMap={handleClearMap}
        onOpenExport={() => setIsExportModalOpen(true)}
        onImportJson={handleImportJson}
      />

      <div className="main-content">
        {/* Floating Canvas Toolbar */}
        <CanvasToolbar
          mode={mode}
          setMode={setMode}
          selectedNodeType={selectedNodeType}
          setSelectedNodeType={setSelectedNodeType}
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
          zoom={zoom}
          onZoomIn={() => setZoom(z => Math.min(z * 1.15, 3.0))}
          onZoomOut={() => setZoom(z => Math.max(z * 0.85, 0.3))}
          onResetView={() => setZoom(1.0)}
        />

        {/* Interactive Blueprint Canvas */}
        <BlueprintCanvas
          nodes={nodes}
          edges={edges}
          walls={walls}
          activeFloor={activeFloor}
          mode={mode}
          selectedNodeType={selectedNodeType}
          snapToGrid={snapToGrid}
          zoom={zoom}
          setZoom={setZoom}
          selectedElement={selectedElement}
          setSelectedElement={(elem) => {
            setSelectedElement(elem);
            if (elem) setActiveTab('inspector');
          }}
          onAddNode={handleAddNode}
          onUpdateNodePosition={handleUpdateNodePosition}
          onAddEdge={handleAddEdge}
          onAddWall={handleAddWall}
          activeRoute={activeRoute}
          onSelectRoutePoints={(startId, goalId) => {
            setStartNodeId(startId);
            setGoalNodeId(goalId);
            setActiveTab('route');
          }}
          isWalking={isWalking}
          walkProgress={walkProgress}
        />

        {/* Sidebar Controls */}
        <aside className="sidebar">
          {/* Sidebar Tab Selector */}
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activeTab === 'route' ? 'active' : ''}`}
              onClick={() => setActiveTab('route')}
            >
              <Navigation size={15} />
              Navigation
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'inspector' ? 'active' : ''}`}
              onClick={() => setActiveTab('inspector')}
            >
              <Edit3 size={15} />
              Inspector
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'floors' ? 'active' : ''}`}
              onClick={() => setActiveTab('floors')}
            >
              <Layers size={15} />
              Floors
            </button>
          </div>

          <div className="sidebar-content">
            {activeTab === 'route' && (
              <RoutePlannerPanel
                nodes={nodes}
                startNodeId={startNodeId}
                setStartNodeId={setStartNodeId}
                goalNodeId={goalNodeId}
                setGoalNodeId={setGoalNodeId}
                onCalculateRoute={handleCalculateRoute}
                activeRoute={activeRoute}
                routeError={routeError}
                instructions={instructions}
                isWalking={isWalking}
                onToggleWalking={() => setIsWalking(w => !w)}
                walkProgress={walkProgress}
              />
            )}

            {activeTab === 'inspector' && (
              <InspectorPanel
                selectedNode={selectedElement}
                floors={floors}
                onUpdateNode={handleUpdateNode}
                onDeleteNode={handleDeleteNode}
                onSetAsStart={(nodeId) => {
                  setStartNodeId(nodeId);
                  setActiveTab('route');
                }}
                onSetAsGoal={(nodeId) => {
                  setGoalNodeId(nodeId);
                  setActiveTab('route');
                }}
              />
            )}

            {activeTab === 'floors' && (
              <FloorManager
                floors={floors}
                activeFloor={activeFloor}
                setActiveFloor={setActiveFloor}
                onAddFloor={handleAddFloor}
                onRemoveFloor={handleRemoveFloor}
              />
            )}
          </div>
        </aside>
      </div>

      {/* AR JSON Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        exportData={exportData}
      />
    </div>
  );
}
