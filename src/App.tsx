import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import ThreeCanvas from './components/ThreeCanvas';
import Sidebar from './components/Sidebar';
import Outliner from './components/Outliner';
import Toolbar from './components/Toolbar';
import InfoPanel from './components/InfoPanel';
import HelpModal from './components/HelpModal';
import TemplatesDropdown from './components/TemplatesDropdown';
import StatusBar from './components/StatusBar';
import SelectionOverlay from './components/SelectionOverlay';
import ContextMenu from './components/ContextMenu';
import ErrorBoundary from './components/ErrorBoundary';
import { Sounds } from './utils/sound';

export const App: React.FC = () => {
  // Check if user has already dismissed the help modal
  const [helpVisible, setHelpVisible] = useState(() => {
    return !localStorage.getItem('pioneering_help_seen');
  });
  const [templatesVisible, setTemplatesVisible] = useState(false);
  const [inspectorVisible, setInspectorVisible] = useState(true);
  
  const setTransformMode = useStore(state => state.setTransformMode);
  const setActiveTool = useStore(state => state.setActiveTool);
  
  const proximityActive = useStore(state => state.proximityActive);
  const currentProximityCandidate = useStore(state => state.currentProximityCandidate);
  const activeSnapCandidate = useStore(state => state.activeSnapCandidate);
  const addLashing = useStore(state => state.addLashing);
  
  const deleteSelected = useStore(state => state.deleteSelected);
  const undo = useStore(state => state.undo);
  const redo = useStore(state => state.redo);
  const clearSelection = useStore(state => state.clearSelection);

  const duplicateSelectedSpar = useStore(state => state.duplicateSelectedSpar);
  const nudgeSelectedSpars = useStore(state => state.nudgeSelectedSpars);
  const selectAll = useStore(state => state.selectAll);

  const addGuidePoint = useStore(state => state.addGuidePoint);
  const addGuideLine = useStore(state => state.addGuideLine);
  const toggleBoundary = useStore(state => state.toggleBoundary);
  const addStake = useStore(state => state.addStake);
  const dropSparToGround = useStore(state => state.dropSparToGround);
  const moveSparToTarget = useStore(state => state.moveSparToTarget);
  const toggleGizmoSpace = useStore(state => state.toggleGizmoSpace);

  const toggleSmartSnapping = useStore(state => state.toggleSmartSnapping);
  const setIsAltSnapSuppressed = useStore(state => state.setIsAltSnapSuppressed);

  const handleCreateLashClick = React.useCallback(() => {
    if (currentProximityCandidate) {
      addLashing(
        currentProximityCandidate.sparA,
        currentProximityCandidate.sparB,
        currentProximityCandidate.point,
        currentProximityCandidate.angle,
        currentProximityCandidate.type,
        true,
        true
      );
    }
  }, [currentProximityCandidate, addLashing]);

  // Keydown Hotkeys handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltSnapSuppressed(true);
      }

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

      const key = e.key.toLowerCase();

      if (key === 'w' || key === 't') {
        Sounds.playClick();
        setTransformMode('translate');
      }
      if (key === 'e' || key === 'r') {
        Sounds.playClick();
        setTransformMode('rotate');
      }
      if (key === 'x') {
        Sounds.playClick();
        toggleGizmoSpace();
      }
      if (key === 'q') {
        Sounds.playClick();
        setActiveTool('select_box');
      }
      if (key === 'f') {
        Sounds.playClick();
        setActiveTool('select_lasso');
      }
      if (key === 'b') {
        dropSparToGround();
      }
      if (key === 'm') {
        moveSparToTarget();
      }
      if (key === 's' && !(e.ctrlKey || e.metaKey)) {
        Sounds.playClick();
        toggleSmartSnapping();
      }
      if (key === 'k') {
        addStake();
      }
      if (key === 'p') {
        addGuidePoint();
      }
      if (key === 'l') {
        addGuideLine();
      }
      if (key === 'g') {
        toggleBoundary();
      }
      if (e.key === 'Delete') {
        deleteSelected();
      }
      // Universal layout-independent Undo & Redo (supports Arabic, English, AZERTY, QWERTZ, Mac, Windows)
      const isZKey = e.code === 'KeyZ' || key === 'z' || key === 'ئ';
      const isYKey = e.code === 'KeyY' || key === 'y' || key === 'غ';
      const isModifierHeld = e.ctrlKey || e.metaKey;

      if (isModifierHeld && isZKey && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      if (isModifierHeld && ((isZKey && e.shiftKey) || (isYKey && !e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      // Duplicate selected spars: Shift+D or D (avoids Google Chrome Ctrl+D bookmark collision)
      if (
        (key === 'd' || e.code === 'KeyD') &&
        (e.shiftKey || (!e.ctrlKey && !e.altKey && !e.metaKey) || (e.ctrlKey || e.metaKey))
      ) {
        e.preventDefault();
        duplicateSelectedSpar();
      }
      if (key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectAll();
      }
      if (key === 'c' || e.key === 'Escape') {
        clearSelection();
        setActiveTool(null);
      }

      // Space to accept proximity lashing
      if (e.code === 'Space' && proximityActive && currentProximityCandidate) {
        e.preventDefault();
        handleCreateLashClick();
      }

      // Precise keyboard nudging with Arrow Keys
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          nudgeSelectedSpars('y', 0.05);
        } else {
          nudgeSelectedSpars('z', -0.05);
        }
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          if (e.shiftKey) {
            dropSparToGround();
          } else {
            nudgeSelectedSpars('y', -0.05);
          }
        } else {
          nudgeSelectedSpars('z', 0.05);
        }
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudgeSelectedSpars('x', -0.05);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudgeSelectedSpars('x', 0.05);
      }
      if (e.key === 'PageUp') {
        e.preventDefault();
        nudgeSelectedSpars('y', 0.05);
      }
      if (e.key === 'PageDown') {
        e.preventDefault();
        nudgeSelectedSpars('y', -0.05);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltSnapSuppressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    setTransformMode,
    setActiveTool,
    toggleSmartSnapping,
    setIsAltSnapSuppressed,
    deleteSelected,
    undo,
    redo,
    clearSelection,
    dropSparToGround,
    moveSparToTarget,
    addStake,
    addGuidePoint,
    addGuideLine,
    toggleBoundary,
    duplicateSelectedSpar,
    nudgeSelectedSpars,
    selectAll,
    proximityActive,
    currentProximityCandidate,
    handleCreateLashClick,
    toggleGizmoSpace
  ]);

  const spars = useStore(state => state.spars);
  const lashings = useStore(state => state.lashings);
  const stakes = useStore(state => state.stakes);
  const guyLines = useStore(state => state.guyLines);
  const guidePoints = useStore(state => state.guidePoints);
  const guideLines = useStore(state => state.guideLines);
  const boundaryEnabled = useStore(state => state.boundaryEnabled);
  const boundaryWidth = useStore(state => state.boundaryWidth);
  const boundaryLength = useStore(state => state.boundaryLength);
  const boundaryAlignment = useStore(state => state.boundaryAlignment);
  const spawnZoneEnabled = useStore(state => state.spawnZoneEnabled);
  const spawnZoneWidth = useStore(state => state.spawnZoneWidth);
  const spawnZoneLength = useStore(state => state.spawnZoneLength);
  const spawnZoneCenter = useStore(state => state.spawnZoneCenter);

  // Load autosave on mount
  useEffect(() => {
    const saved = localStorage.getItem('pioneering_autosave');
    if (saved) {
      try {
        const importFromJSON = useStore.getState().importFromJSON;
        importFromJSON(saved);
      } catch (e) {
        console.error("Autosave load failed", e);
      }
    }
  }, []);

  // Save to localStorage debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      const json = useStore.getState().exportToJSON();
      localStorage.setItem('pioneering_autosave', json);
    }, 1000);
    return () => clearTimeout(timer);
  }, [
    spars, lashings, stakes, guyLines, guidePoints, guideLines,
    boundaryEnabled, boundaryWidth, boundaryLength, boundaryAlignment,
    spawnZoneEnabled, spawnZoneWidth, spawnZoneLength, spawnZoneCenter
  ]);

  const handleCloseHelp = () => {
    setHelpVisible(false);
    localStorage.setItem('pioneering_help_seen', 'true');
  };

  return (
    <div className="bg-editor-bg text-txt-primary overflow-hidden h-screen select-none font-sans flex flex-col antialiased">
      
      {/* ═══ Top Header Bar ═══ */}
      <Toolbar 
        onShowHelp={() => setHelpVisible(true)} 
        onShowTemplates={() => setTemplatesVisible(true)}
      />

      {/* ═══ Main Content Area ═══ */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Tool Shelf (Creation Palette on Right in RTL) */}
        <Sidebar />

        {/* 3D Viewport (Center - takes all remaining space) */}
        <div className="flex-1 relative overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
          <ErrorBoundary fallbackTitle="حدث خطأ أثناء عرض المشهد ثلاثي الأبعاد">
            <ThreeCanvas />
          </ErrorBoundary>
          
          {/* Selection Overlay (rendered on top of 3D canvas) */}
          <SelectionOverlay />

          {/* Floating Smart Snapping Active Feedback Pill */}
          {activeSnapCandidate && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in">
              <div
                className="px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2.5 backdrop-blur-xl border border-white/20"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.94)',
                  boxShadow: `0 8px 30px rgba(0, 0, 0, 0.7), 0 0 20px ${activeSnapCandidate.color}50`,
                  border: `1.5px solid ${activeSnapCandidate.color}`
                }}
                dir="rtl"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
                  style={{ backgroundColor: activeSnapCandidate.color, boxShadow: `0 0 8px ${activeSnapCandidate.color}` }}
                />
                <span className="text-white text-xs font-bold tracking-wide font-sans">
                  {activeSnapCandidate.labelAr}
                </span>
              </div>
            </div>
          )}

          {/* Toggle Inspector Floating Button */}
          <button
            onClick={() => setInspectorVisible(!inspectorVisible)}
            className="absolute top-3 left-3 z-20 dcc-btn text-xs font-semibold py-1.5 px-3 rounded-lg bg-editor-surface/80 hover:bg-editor-surface backdrop-blur-md border border-editor-border shadow-md transition-all"
            title={inspectorVisible ? "إخفاء لوحة الخصائص" : "إظهار لوحة الخصائص"}
          >
            {inspectorVisible ? '◀ إخفاء اللوحة' : '▶ إظهار اللوحة'}
          </button>
          
          {/* Floating Proximity Lashing Suggestion Banner */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 pointer-events-none">
            {proximityActive && currentProximityCandidate && (
              <div className="dcc-panel rounded-2xl px-4 py-2.5 flex items-center gap-3.5 pointer-events-auto border border-accent/60 shadow-card-elevated backdrop-blur-xl slide-up bg-editor-panel/95">
                <div className="w-3.5 h-3.5 rounded-full bg-accent animate-ping" />
                <div className="text-right">
                  <span className="text-xs font-extrabold text-accent block">
                    ✨ تقاطع كشفي مكتشف!
                  </span>
                  <span className="text-[11px] text-txt-secondary">
                    {currentProximityCandidate.type === 'square' && 'ربطة مربعة (90°)'}
                    {currentProximityCandidate.type === 'diagonal' && 'ربطة قطرية'}
                    {currentProximityCandidate.type === 'shear' && 'ربطة قص متوازية'}
                  </span>
                </div>
                <button
                  onClick={handleCreateLashClick}
                  className="dcc-btn text-xs font-bold py-1.5 px-3.5 bg-gradient-to-r from-forest-600 to-forest-500 hover:from-forest-500 hover:to-forest-400 text-white rounded-xl shadow-glow-emerald border border-forest-400/40 transition-all active:scale-95"
                >
                  🪢 ربط الآن [Space]
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Left Side (in RTL): Properties Inspector + Outliner */}
        {inspectorVisible && (
          <div className="flex flex-col w-[340px] min-w-[280px] max-w-[400px] border-r border-editor-border bg-editor-surface/40 backdrop-blur-md transition-all duration-200">
            {/* Properties Panel (top 55%) */}
            <div className="flex-[6] overflow-hidden flex flex-col min-h-0">
              <InfoPanel />
            </div>
            
            {/* Outliner & BOM (bottom 45%) */}
            <div className="flex-[5] overflow-hidden flex flex-col min-h-0">
              <Outliner />
            </div>
          </div>
        )}
      </div>

      {/* ═══ Bottom Status Bar ═══ */}
      <StatusBar />

      {/* ═══ Modals ═══ */}
      <HelpModal visible={helpVisible} onClose={handleCloseHelp} />
      <TemplatesDropdown visible={templatesVisible} onClose={() => setTemplatesVisible(false)} />
      <ContextMenu />
    </div>
  );
};

export default App;
