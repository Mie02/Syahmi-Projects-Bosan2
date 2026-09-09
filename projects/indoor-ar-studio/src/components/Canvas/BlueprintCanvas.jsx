import React, { useRef, useEffect, useState, useCallback } from 'react';
import { NODE_TYPES } from '../../types/defaultTemplates';

export default function BlueprintCanvas({
  nodes,
  edges,
  walls,
  activeFloor,
  mode,
  selectedNodeType,
  snapToGrid,
  zoom,
  setZoom,
  selectedElement,
  setSelectedElement,
  onAddNode,
  onUpdateNodePosition,
  onAddEdge,
  onAddWall,
  activeRoute,
  onSelectRoutePoints,
  isWalking,
  walkProgress,
}) {
  const canvasRef = useRef(null);
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging node state
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Connection mode state
  const [connectSourceNodeId, setConnectSourceNodeId] = useState(null);

  // Wall drawing state
  const [wallStart, setWallStart] = useState(null);
  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });

  // Simulation mode selection state
  const [simStartNodeId, setSimStartNodeId] = useState(null);

  // Animation pulse offset for route
  const animOffsetRef = useRef(0);

  // Transform screen to world coordinates
  const screenToWorld = useCallback((screenX, screenY) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // Transform world to screen coordinates
  const worldToScreen = useCallback((worldX, worldY) => {
    return {
      x: worldX * zoom + pan.x,
      y: worldY * zoom + pan.y,
    };
  }, [pan, zoom]);

  // Snap to 20px grid
  const snapCoord = (val) => {
    if (!snapToGrid) return Math.round(val);
    const gridSize = 20;
    return Math.round(val / gridSize) * gridSize;
  };

  // Find node at screen position
  const findNodeAtPos = useCallback((screenX, screenY, radius = 18) => {
    const world = screenToWorld(screenX, screenY);
    for (const node of nodes) {
      if (node.floor !== activeFloor) continue;
      const dist = Math.hypot(node.x - world.x, node.y - world.y);
      if (dist <= radius / zoom) {
        return node;
      }
    }
    return null;
  }, [nodes, activeFloor, screenToWorld, zoom]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;

    const render = () => {
      animOffsetRef.current = (animOffsetRef.current + 0.4) % 40;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.parentElement.clientWidth;
      const height = canvas.parentElement.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Draw Blueprint Background
      ctx.fillStyle = '#070b13';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Blueprint Grid
      const gridSize = 20 * zoom;
      const majorGridSize = 100 * zoom;

      const startX = pan.x % gridSize;
      const startY = pan.y % gridSize;

      // Minor grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = startX; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = startY; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Major grid lines (every 5 meters)
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.09)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const majorStartX = pan.x % majorGridSize;
      const majorStartY = pan.y % majorGridSize;
      for (let x = majorStartX; x < width; x += majorGridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = majorStartY; y < height; y += majorGridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Apply World Transformations
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // 3. Draw Walls / Obstacles for Active Floor
      const floorWalls = walls.filter(w => w.floor === activeFloor);
      for (const wall of floorWalls) {
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(wall.x1, wall.y1);
        ctx.lineTo(wall.x2, wall.y2);
        ctx.stroke();
        ctx.restore();
      }

      // Temporary wall being drawn
      if (mode === 'wall' && wallStart) {
        ctx.save();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 4;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(wallStart.x, wallStart.y);
        ctx.lineTo(currentMousePos.x, currentMousePos.y);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Draw Corridors / Edges
      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      for (const edge of edges) {
        const nA = nodeMap.get(edge.sourceId);
        const nB = nodeMap.get(edge.targetId);
        if (!nA || !nB) continue;

        // Skip edges on other floors unless vertical connector
        const isCurrentFloor = nA.floor === activeFloor && nB.floor === activeFloor;
        const isVertical = nA.floor !== nB.floor && (nA.floor === activeFloor || nB.floor === activeFloor);

        if (!isCurrentFloor && !isVertical) continue;

        ctx.save();
        if (isVertical) {
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 6]);
          ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
          ctx.shadowBlur = 6;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(nA.x, nA.y);
        ctx.lineTo(nB.x, nB.y);
        ctx.stroke();
        ctx.restore();
      }

      // Temporary edge being connected
      if (mode === 'connect' && connectSourceNodeId) {
        const srcNode = nodeMap.get(connectSourceNodeId);
        if (srcNode) {
          ctx.save();
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(srcNode.x, srcNode.y);
          ctx.lineTo(currentMousePos.x, currentMousePos.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 5. Draw Active Route (Pulsing Animated Cyan/Emerald Path)
      if (activeRoute && activeRoute.path && activeRoute.path.length > 1) {
        const floorSegments = [];
        for (let i = 0; i < activeRoute.path.length - 1; i++) {
          const u = activeRoute.path[i];
          const v = activeRoute.path[i + 1];
          if (u.floor === activeFloor && v.floor === activeFloor) {
            floorSegments.push([u, v]);
          }
        }

        for (const [u, v] of floorSegments) {
          ctx.save();
          // Glow underlayer
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
          ctx.lineWidth = 10;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(u.x, u.y);
          ctx.lineTo(v.x, v.y);
          ctx.stroke();

          // Core pulsing dashed line
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 4;
          ctx.setLineDash([12, 8]);
          ctx.lineDashOffset = -animOffsetRef.current;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(u.x, u.y);
          ctx.lineTo(v.x, v.y);
          ctx.stroke();
          ctx.restore();
        }

        // Animated Walking Avatar Dot
        if (isWalking && activeRoute.path.length > 0) {
          const activeFloorPath = activeRoute.path.filter(n => n.floor === activeFloor);
          if (activeFloorPath.length > 1) {
            const totalSegs = activeFloorPath.length - 1;
            const progressScaled = walkProgress * totalSegs;
            const segIndex = Math.min(Math.floor(progressScaled), totalSegs - 1);
            const segT = progressScaled - segIndex;

            const pA = activeFloorPath[segIndex];
            const pB = activeFloorPath[segIndex + 1];
            const dotX = pA.x + (pB.x - pA.x) * segT;
            const dotY = pA.y + (pB.y - pA.y) * segT;

            ctx.save();
            ctx.fillStyle = '#10b981';
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 9, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // 6. Draw Waypoint Nodes for Active Floor
      const floorNodes = nodes.filter(n => n.floor === activeFloor);
      for (const node of floorNodes) {
        const typeCfg = NODE_TYPES[node.type] || NODE_TYPES.corridor;
        const isSelected = selectedElement?.id === node.id;
        const isRouteStart = activeRoute?.path?.[0]?.id === node.id;
        const isRouteEnd = activeRoute?.path?.[activeRoute.path.length - 1]?.id === node.id;
        const isConnectSource = connectSourceNodeId === node.id;
        const isSimStart = simStartNodeId === node.id;

        ctx.save();

        // Highlight Glow for selected or route endpoints
        if (isSelected || isRouteStart || isRouteEnd || isConnectSource || isSimStart) {
          ctx.shadowColor = isRouteStart ? '#10b981' : isRouteEnd ? '#f43f5e' : '#00f0ff';
          ctx.shadowBlur = 16;
          ctx.strokeStyle = isRouteStart ? '#10b981' : isRouteEnd ? '#f43f5e' : '#00f0ff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Outer Ring for AR Anchors
        if (node.markerId) {
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(node.x, node.y, 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Inner Circle Node
        ctx.fillStyle = typeCfg.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#070b13';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Node Label
        ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        const labelText = node.name;
        const textWidth = ctx.measureText(labelText).width;

        // Label background badge
        ctx.fillStyle = 'rgba(8, 12, 20, 0.85)';
        ctx.fillRect(node.x - textWidth / 2 - 4, node.y + 14, textWidth + 8, 16);
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(node.x - textWidth / 2 - 4, node.y + 14, textWidth + 8, 16);

        // Label Text
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(labelText, node.x, node.y + 26);

        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [
    nodes,
    edges,
    walls,
    activeFloor,
    pan,
    zoom,
    selectedElement,
    mode,
    wallStart,
    currentMousePos,
    connectSourceNodeId,
    activeRoute,
    isWalking,
    walkProgress,
    simStartNodeId,
  ]);

  // Mouse Handlers
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);

    // Pan with Middle Mouse or Spacebar/Right Click
    if (e.button === 1 || e.button === 2 || e.altKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button === 0) {
      const clickedNode = findNodeAtPos(screenX, screenY);

      if (mode === 'select') {
        if (clickedNode) {
          setSelectedElement(clickedNode);
          setDraggedNodeId(clickedNode.id);
          setDragOffset({ x: world.x - clickedNode.x, y: world.y - clickedNode.y });
        } else {
          setSelectedElement(null);
          // Start canvas pan if clicked on background
          setIsPanning(true);
          setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
      } else if (mode === 'add_node') {
        onAddNode({
          name: `Waypoint ${nodes.length + 1}`,
          type: selectedNodeType,
          x: snapCoord(world.x),
          y: snapCoord(world.y),
          floor: activeFloor,
        });
      } else if (mode === 'connect') {
        if (clickedNode) {
          if (!connectSourceNodeId) {
            setConnectSourceNodeId(clickedNode.id);
          } else if (connectSourceNodeId !== clickedNode.id) {
            onAddEdge(connectSourceNodeId, clickedNode.id);
            setConnectSourceNodeId(null);
          }
        }
      } else if (mode === 'wall') {
        setWallStart({ x: snapCoord(world.x), y: snapCoord(world.y) });
      } else if (mode === 'simulate') {
        if (clickedNode) {
          if (!simStartNodeId) {
            setSimStartNodeId(clickedNode.id);
          } else {
            onSelectRoutePoints(simStartNodeId, clickedNode.id);
            setSimStartNodeId(null);
          }
        }
      }
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);

    setCurrentMousePos({ x: snapCoord(world.x), y: snapCoord(world.y) });

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggedNodeId) {
      const snappedX = snapCoord(world.x - dragOffset.x);
      const snappedY = snapCoord(world.y - dragOffset.y);
      onUpdateNodePosition(draggedNodeId, snappedX, snappedY);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggedNodeId) {
      setDraggedNodeId(null);
    }
    if (mode === 'wall' && wallStart) {
      if (Math.hypot(currentMousePos.x - wallStart.x, currentMousePos.y - wallStart.y) > 10) {
        onAddWall({
          x1: wallStart.x,
          y1: wallStart.y,
          x2: currentMousePos.x,
          y2: currentMousePos.y,
          floor: activeFloor,
        });
      }
      setWallStart(null);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.3), 3.0);

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  return (
    <div className="canvas-container" onContextMenu={(e) => e.preventDefault()}>
      <canvas
        ref={canvasRef}
        className="blueprint-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
}
