import React from 'react';
import { useStore, computeBoundaryBounds, isSparOutOfBounds, isStakeOutOfBounds } from '../store/useStore';

export const StatusBar: React.FC = () => {
  const spars = useStore(state => state.spars);
  const lashings = useStore(state => state.lashings);
  const stakes = useStore(state => state.stakes);
  const guyLines = useStore(state => state.guyLines);

  const transformMode = useStore(state => state.transformMode);
  const simulationActive = useStore(state => state.simulationActive);
  const runStabilitySimulation = useStore(state => state.runStabilitySimulation);
  const stopStabilitySimulation = useStore(state => state.stopStabilitySimulation);

  const boundaryEnabled = useStore(state => state.boundaryEnabled);
  const boundaryWidth = useStore(state => state.boundaryWidth);
  const boundaryLength = useStore(state => state.boundaryLength);
  const boundaryAlignment = useStore(state => state.boundaryAlignment);
  const assumeAllInsideBoundary = useStore(state => state.assumeAllInsideBoundary);
  const toggleAssumeAllInsideBoundary = useStore(state => state.toggleAssumeAllInsideBoundary);
  const focusNextOutOfBoundsSpar = useStore(state => state.focusNextOutOfBoundsSpar);

  const activeTool = useStore(state => state.activeTool);
  const smartSnappingEnabled = useStore(state => state.smartSnappingEnabled);
  const lashingEndOffset = useStore(state => state.lashingEndOffset);
  const isAltSnapSuppressed = useStore(state => state.isAltSnapSuppressed);

  // Check boundary violations
  const bounds = computeBoundaryBounds(boundaryWidth, boundaryLength, boundaryAlignment);
  const outOfBoundsSpars = boundaryEnabled && !assumeAllInsideBoundary
    ? spars.filter(s => s.visible !== false && isSparOutOfBounds(s, bounds))
    : [];
  const outOfBoundsStakes = boundaryEnabled && !assumeAllInsideBoundary
    ? stakes.filter(s => s.visible !== false && isStakeOutOfBounds(s, bounds))
    : [];
  const totalViolations = outOfBoundsSpars.length + outOfBoundsStakes.length;
  const hasViolation = totalViolations > 0;

  return (
    <footer className="dcc-header flex items-center justify-between h-8 px-3 text-xs select-none border-t border-editor-border z-30 shadow-xs">
      
      {/* Right side in RTL: Scene elements count chips */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-editor-surface/90 border border-editor-border/60">
          <span className="w-2 h-2 rounded-full bg-cat-spar inline-block shadow-xs" />
          <span className="text-txt-muted text-[11px]">الأخشاب:</span>
          <span className="text-txt-primary font-bold font-mono text-[11px]">{spars.length}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-editor-surface/90 border border-editor-border/60">
          <span className="w-2 h-2 rounded-full bg-cat-lashing inline-block shadow-xs" />
          <span className="text-txt-muted text-[11px]">الربطات:</span>
          <span className="text-txt-primary font-bold font-mono text-[11px]">{lashings.length}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-editor-surface/90 border border-editor-border/60">
          <span className="w-2 h-2 rounded-full bg-cat-stake inline-block shadow-xs" />
          <span className="text-txt-muted text-[11px]">الأوتاد:</span>
          <span className="text-txt-primary font-bold font-mono text-[11px]">{stakes.length}</span>
        </div>

        {guyLines.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-editor-surface/90 border border-editor-border/60">
            <span className="w-2 h-2 rounded-full bg-cat-guyline inline-block shadow-xs" />
            <span className="text-txt-muted text-[11px]">حبال الشد:</span>
            <span className="text-txt-primary font-bold font-mono text-[11px]">{guyLines.length}</span>
          </div>
        )}
      </div>

      {/* Center: Current active tool & Boundary Alert */}
      <div className="flex items-center justify-center gap-3">
        {/* Boundary violation alert with 1-click Focus and Assume All button */}
        {boundaryEnabled && hasViolation && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={focusNextOutOfBoundsSpar}
              title="انقر للتنقل الفوري للخشبة المتجاوزة وتحديدها"
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-status-warning/20 hover:bg-status-warning/30 text-amber-300 border border-status-warning/40 font-bold text-[11px] transition-all cursor-pointer shadow-sm hover:scale-102 active:scale-98 animate-pulse"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6z"/>
                <rect x="11" y="10" width="2" height="5"/>
                <rect x="11" y="16" width="2" height="2"/>
              </svg>
              <span>⚠️ {totalViolations} عنصر خارج الأرض [انقر للوصول إليها 🎯]</span>
            </button>

            <button
              type="button"
              onClick={() => toggleAssumeAllInsideBoundary(true)}
              title="اعتماد كافة الأخشاب داخل المساحة المطلوبة (تجاوز الفحص لتجميع الخشب بالخارج)"
              className="px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition-all cursor-pointer"
            >
              ✓ اعتماد الكل داخل المساحة
            </button>
          </div>
        )}

        {boundaryEnabled && assumeAllInsideBoundary && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px]">
            <span>✓ معتمد: كافة الأخشاب داخل المساحة المطلوبة</span>
            <button
              type="button"
              onClick={() => toggleAssumeAllInsideBoundary(false)}
              className="text-[10px] underline text-txt-muted hover:text-txt-primary mr-1 cursor-pointer"
              title="إعادة تفعيل المراقبة الصارمة للحدود"
            >
              (تفعيل التدقيق)
            </button>
          </div>
        )}

        {/* Active Tool Badge */}
        {!simulationActive && (
          <div className="flex items-center gap-2 text-txt-secondary text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-txt-muted">الأداة:</span>
              {activeTool === 'select_box' ? (
                <span className="text-accent font-bold bg-accent/10 px-2 py-0.5 rounded border border-accent/30">
                  تحديد مربع [Q]
                </span>
              ) : activeTool === 'select_lasso' ? (
                <span className="text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30">
                  تحديد حر [F]
                </span>
              ) : transformMode === 'translate' ? (
                <span className="text-sky-400 font-bold bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/30">
                  تحريك [W]
                </span>
              ) : (
                <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/30">
                  تدوير [E]
                </span>
              )}
            </div>

            {smartSnappingEnabled && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>انجذاب كشفي ({Math.round(lashingEndOffset * 100)} سم) [S]</span>
                {isAltSnapSuppressed && (
                  <span className="text-amber-300 font-bold bg-amber-400/20 px-1 rounded text-[10px]">تجاوز حر [Alt]</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Left side in RTL: Stability simulation trigger */}
      <div className="flex items-center gap-2">
        {!simulationActive ? (
          <button
            onClick={runStabilitySimulation}
            className="dcc-btn text-[11px] font-bold gap-1.5 py-1 px-3 bg-gradient-to-r from-forest-600/20 to-forest-500/20 hover:from-forest-600/40 hover:to-forest-500/40 text-forest-400 border border-forest-500/40 rounded-lg transition-all shadow-xs"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v6M12 18v4M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M18 12h4M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" />
            </svg>
            اختبار الاستقرار الفيزيائي
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-status-info/15 border border-status-info/40 px-2.5 py-0.5 rounded-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-info opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-info"></span>
            </span>
            <span className="text-status-info text-[11px] font-bold">جاري محاكاة الاستقرار...</span>
            <button
              onClick={stopStabilitySimulation}
              className="px-2 py-0.5 bg-editor-hover hover:bg-editor-panel border border-editor-border rounded text-txt-primary text-[10px] font-bold transition-colors"
            >
              إعادة ضبط
            </button>
          </div>
        )}
      </div>
    </footer>
  );
};

export default StatusBar;
