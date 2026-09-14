import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

interface Point {
  x: number;
  y: number;
}

/**
 * SelectionOverlay renders an HTML overlay on top of the 3D viewport.
 * Supports:
 * - Box Select (click+drag rectangle)
 * - Lasso Select (click+drag freeform polygon)
 * - Shift held = additive multi-select
 */
export const SelectionOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);
  const [selectionCount, setSelectionCount] = useState(0);
  const shiftHeld = useRef(false);

  const activeTool = useStore(state => state.activeTool);
  const spars = useStore(state => state.spars);

  const selectMultipleSpars = useStore(state => state.selectMultipleSpars);
  const cameraRef = useStore(state => state.cameraRef);

  // Track shift key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeld.current = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeld.current = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Project a 3D position to screen coordinates
  const projectToScreen = useCallback((position: THREE.Vector3, camera: THREE.Camera, rect: DOMRect): Point | null => {
    const projected = position.clone().project(camera);
    // NDC [-1,1] to pixel coordinates
    const x = (projected.x + 1) / 2 * rect.width;
    const y = (-projected.y + 1) / 2 * rect.height;
    // Skip if behind camera
    if (projected.z > 1) return null;
    return { x, y };
  }, []);

  // Check if point is inside a rectangle
  const isInsideRect = useCallback((point: Point, rectStart: Point, rectEnd: Point): boolean => {
    const minX = Math.min(rectStart.x, rectEnd.x);
    const maxX = Math.max(rectStart.x, rectEnd.x);
    const minY = Math.min(rectStart.y, rectEnd.y);
    const maxY = Math.max(rectStart.y, rectEnd.y);
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }, []);

  // Check if point is inside a polygon (ray casting algorithm)
  const isInsidePolygon = useCallback((point: Point, polygon: Point[]): boolean => {
    if (polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }, []);

  // Get spars that fall within the selection shape
  const getSelectedSpars = useCallback((shape: 'box' | 'lasso', start?: Point, end?: Point, polygon?: Point[]) => {
    if (!cameraRef || !containerRef.current) return [];
    const rect = containerRef.current.getBoundingClientRect();
    const selected: typeof spars = [];

    spars.forEach(spar => {
      if (spar.visible === false) return;
      const halfL = spar.length / 2;
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(spar.quaternion);
      const p1 = spar.position.clone().addScaledVector(up, -halfL);
      const p2 = spar.position.clone().addScaledVector(up, halfL);

      const screenPos1 = projectToScreen(p1, cameraRef, rect);
      const screenPos2 = projectToScreen(p2, cameraRef, rect);
      const screenMid = projectToScreen(spar.position, cameraRef, rect);

      const checkPoint = (pt: Point | null) => {
        if (!pt) return false;
        if (shape === 'box' && start && end) {
          return isInsideRect(pt, start, end);
        } else if (shape === 'lasso' && polygon) {
          return isInsidePolygon(pt, polygon);
        }
        return false;
      };

      if (checkPoint(screenMid) || checkPoint(screenPos1) || checkPoint(screenPos2)) {
        selected.push(spar);
      }
    });

    return selected;
  }, [cameraRef, spars, projectToScreen, isInsideRect, isInsidePolygon]);

  // Draw selection shape on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match container
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isDragging || !activeTool) return;

    if (activeTool === 'select_box' && startPoint && currentPoint) {
      const x = Math.min(startPoint.x, currentPoint.x);
      const y = Math.min(startPoint.y, currentPoint.y);
      const w = Math.abs(currentPoint.x - startPoint.x);
      const h = Math.abs(currentPoint.y - startPoint.y);

      // Semi-transparent fill
      ctx.fillStyle = 'rgba(75, 139, 255, 0.12)';
      ctx.fillRect(x, y, w, h);

      // Animated dashed border
      ctx.strokeStyle = 'rgba(75, 139, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.lineDashOffset = -(Date.now() / 50 % 18);
      ctx.strokeRect(x, y, w, h);

      // Corner markers
      ctx.setLineDash([]);
      const markerSize = 4;
      ctx.fillStyle = 'rgba(75, 139, 255, 1)';
      [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, markerSize, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (activeTool === 'select_lasso' && lassoPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
      for (let i = 1; i < lassoPoints.length; i++) {
        ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
      }
      if (currentPoint) {
        ctx.lineTo(currentPoint.x, currentPoint.y);
      }
      ctx.closePath();

      // Semi-transparent fill
      ctx.fillStyle = 'rgba(250, 204, 21, 0.1)';
      ctx.fill();

      // Animated dashed border
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.lineDashOffset = -(Date.now() / 50 % 16);
      ctx.stroke();

      // Draw vertices
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(250, 204, 21, 1)';
      lassoPoints.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [isDragging, startPoint, currentPoint, lassoPoints, activeTool]);

  // Animate the dashed lines
  useEffect(() => {
    if (!isDragging || !activeTool) return;
    let animFrame: number;
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (activeTool === 'select_box' && startPoint && currentPoint) {
        const x = Math.min(startPoint.x, currentPoint.x);
        const y = Math.min(startPoint.y, currentPoint.y);
        const w = Math.abs(currentPoint.x - startPoint.x);
        const h = Math.abs(currentPoint.y - startPoint.y);

        ctx.fillStyle = 'rgba(75, 139, 255, 0.12)';
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = 'rgba(75, 139, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);
        ctx.lineDashOffset = -(Date.now() / 50 % 18);
        ctx.strokeRect(x, y, w, h);

        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(75, 139, 255, 1)';
        [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy]) => {
          ctx.beginPath();
          ctx.arc(cx, cy, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (activeTool === 'select_lasso' && lassoPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
        for (let i = 1; i < lassoPoints.length; i++) {
          ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
        }
        if (currentPoint) ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.closePath();

        ctx.fillStyle = 'rgba(250, 204, 21, 0.1)';
        ctx.fill();

        ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.lineDashOffset = -(Date.now() / 50 % 16);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(250, 204, 21, 1)';
        lassoPoints.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Live count of selected objects
      let count = 0;
      if (activeTool === 'select_box' && startPoint && currentPoint) {
        count = getSelectedSpars('box', startPoint, currentPoint).length;
      } else if (activeTool === 'select_lasso' && lassoPoints.length > 2) {
        const poly = currentPoint ? [...lassoPoints, currentPoint] : lassoPoints;
        count = getSelectedSpars('lasso', undefined, undefined, poly).length;
      }
      setSelectionCount(count);

      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [isDragging, startPoint, currentPoint, lassoPoints, activeTool, getSelectedSpars]);

  const getLocalCoords = (e: React.MouseEvent): Point => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    const pt = getLocalCoords(e);
    setIsDragging(true);
    setStartPoint(pt);
    setCurrentPoint(pt);
    setSelectionCount(0);
    if (activeTool === 'select_lasso') {
      setLassoPoints([pt]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const pt = getLocalCoords(e);
    setCurrentPoint(pt);
    if (activeTool === 'select_lasso') {
      // Only add point if it's far enough from the last one (throttle)
      const last = lassoPoints[lassoPoints.length - 1];
      const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
      if (dist > 4) {
        setLassoPoints(prev => [...prev, pt]);
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const append = shiftHeld.current;

    if (activeTool === 'select_box' && startPoint && currentPoint) {
      const selected = getSelectedSpars('box', startPoint, currentPoint);
      selectMultipleSpars(selected, append);
    } else if (activeTool === 'select_lasso' && lassoPoints.length > 2) {
      const polygon = currentPoint ? [...lassoPoints, currentPoint] : lassoPoints;
      const selected = getSelectedSpars('lasso', undefined, undefined, polygon);
      selectMultipleSpars(selected, append);
    }

    // Reset
    setIsDragging(false);
    setStartPoint(null);
    setCurrentPoint(null);
    setLassoPoints([]);
    setSelectionCount(0);
  };

  if (!activeTool) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10"
      style={{ cursor: activeTool === 'select_box' ? 'crosshair' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      {/* Selection count indicator */}
      {isDragging && selectionCount > 0 && currentPoint && (
        <div
          className="absolute pointer-events-none z-20 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            left: currentPoint.x + 16,
            top: currentPoint.y - 10,
            background: 'rgba(75, 139, 255, 0.9)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {selectionCount}
        </div>
      )}
      {/* Active tool indicator badge */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold"
          style={{
            background: 'rgba(20, 20, 20, 0.85)',
            color: activeTool === 'select_box' ? '#4B8BFF' : '#facc15',
            border: `1px solid ${activeTool === 'select_box' ? 'rgba(75, 139, 255, 0.4)' : 'rgba(250, 204, 21, 0.4)'}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          {activeTool === 'select_box' ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2">
                <rect x="3" y="3" width="18" height="18" rx="1" />
              </svg>
              تحديد مربع
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9S17 3 12 3z" strokeDasharray="4 2" />
              </svg>
              تحديد حر
            </>
          )}
          <span className="text-[9px] opacity-60 mr-1">Shift = إضافة</span>
        </div>
      </div>
    </div>
  );
};

export default SelectionOverlay;
