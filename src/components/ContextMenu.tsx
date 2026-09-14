import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Sounds } from '../utils/sound';

export const ContextMenu: React.FC = () => {
  const contextMenu = useStore(state => state.contextMenu);
  const setContextMenu = useStore(state => state.setContextMenu);
  const selectedSpars = useStore(state => state.selectedSpars);

  // Store actions
  const addSpar = useStore(state => state.addSpar);
  const addStake = useStore(state => state.addStake);
  const addGuidePoint = useStore(state => state.addGuidePoint);
  const selectAll = useStore(state => state.selectAll);
  const clearScene = useStore(state => state.clearScene);

  const groupSelectedSpars = useStore(state => state.groupSelectedSpars);
  const ungroupSelectedSpars = useStore(state => state.ungroupSelectedSpars);
  const duplicateSelectedSpar = useStore(state => state.duplicateSelectedSpar);
  const alignSelectedSpar = useStore(state => state.alignSelectedSpar);
  const dropSparToGround = useStore(state => state.dropSparToGround);
  const deleteSelected = useStore(state => state.deleteSelected);
  const tieSelectedSpars = useStore(state => state.tieSelectedSpars);
  const guidePoints = useStore(state => state.guidePoints);
  const alignSparBetweenPoints = useStore(state => state.alignSparBetweenPoints);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on clicking anywhere else
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (contextMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [contextMenu, setContextMenu]);

  if (!contextMenu) return null;

  const handleAction = (action: () => void) => {
    Sounds.playClick();
    action();
    setContextMenu(null);
  };

  const isGroupable = selectedSpars.length > 1;
  const isUngroupable = selectedSpars.some(s => s.groupId);

  const kbd = (text: string) => (
    <kbd className="px-1.5 py-0.2 rounded bg-editor-input text-txt-muted border border-editor-border text-[10px] font-mono mr-auto">
      {text}
    </kbd>
  );

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[200px] bg-editor-panel/95 border border-editor-border backdrop-blur-xl rounded-xl shadow-card-elevated py-1.5 text-right select-none animate-in fade-in zoom-in-95 duration-100 font-sans"
      style={{
        top: Math.min(contextMenu.y, window.innerHeight - 300),
        left: Math.min(contextMenu.x, window.innerWidth - 220),
        direction: 'rtl'
      }}
    >
      {/* ═══ Canvas Context Menu ═══ */}
      {contextMenu.type === 'canvas' && (
        <>
          <div className="px-3 py-1 text-[11px] font-bold text-txt-muted border-b border-editor-divider mb-1">
            إضافة عناصر للمشهد
          </div>
          <button
            onClick={() => handleAction(() => addSpar('stave'))}
            className="w-full text-right px-3 py-2 text-xs text-txt-primary hover:bg-editor-hover flex items-center gap-2.5 transition-colors"
          >
            <span className="text-cat-spar text-xs">🪵</span>
            <span>عصا قصيرة (1م)</span>
          </button>
          <button
            onClick={() => handleAction(() => addSpar('medium'))}
            className="w-full text-right px-3 py-2 text-xs text-txt-primary hover:bg-editor-hover flex items-center gap-2.5 transition-colors"
          >
            <span className="text-cat-spar text-xs">🪵</span>
            <span>خشب متوسط (3م)</span>
          </button>
          <button
            onClick={() => handleAction(() => addSpar('long'))}
            className="w-full text-right px-3 py-2 text-xs text-txt-primary hover:bg-editor-hover flex items-center gap-2.5 transition-colors"
          >
            <span className="text-cat-spar text-xs">🪵</span>
            <span>خشب طويل (4م)</span>
          </button>
          <button
            onClick={() => handleAction(() => addSpar('xlong'))}
            className="w-full text-right px-3 py-2 text-xs text-txt-primary hover:bg-editor-hover flex items-center gap-2.5 transition-colors"
          >
            <span className="text-cat-spar text-xs">🪵</span>
            <span>خشب طويل جداً (5م)</span>
          </button>
          
          <div className="h-px bg-editor-divider my-1" />

          <button
            onClick={() => handleAction(() => addStake())}
            className="w-full text-right px-3 py-2 text-xs text-txt-primary hover:bg-editor-hover flex items-center gap-2.5 transition-colors"
          >
            <span className="text-cat-stake text-xs">⚓</span>
            <span>وتد تثبيت أرضي</span>
            {kbd('K')}
          </button>
          <button
            onClick={() => handleAction(() => addGuidePoint())}
            className="w-full text-right px-3 py-2 text-xs text-txt-primary hover:bg-editor-hover flex items-center gap-2.5 transition-colors"
          >
            <span className="text-cat-guide text-xs">📐</span>
            <span>نقطة دليل مرجعية</span>
            {kbd('P')}
          </button>

          <div className="h-px bg-editor-divider my-1" />

          <button
            onClick={() => handleAction(() => selectAll())}
            className="w-full text-right px-3 py-2 text-xs text-txt-primary hover:bg-editor-hover flex items-center gap-2.5 transition-colors"
          >
            <span>تحديد الكل</span>
            {kbd('Ctrl+A')}
          </button>
          <button
            onClick={() => handleAction(() => {
              if (confirm('هل أنت متأكد من رغبتك في تفريغ المشهد بالكامل؟')) {
                clearScene();
              }
            })}
            className="w-full text-right px-3 py-2 text-xs text-status-error hover:bg-status-error/10 flex items-center gap-2.5 transition-colors font-semibold"
          >
            <span>🗑️ مسح المشهد بالكامل</span>
          </button>
        </>
      )}

      {/* ═══ Spar (Wood) Context Menu ═══ */}
      {contextMenu.type === 'spar' && (
        <>
          <div className="px-3 py-1 text-[11px] font-bold text-cat-spar border-b border-editor-divider mb-1">
            إجراءات الخشب
          </div>
          {isGroupable && (
            <button
              onClick={() => handleAction(() => groupSelectedSpars())}
              className="w-full text-right px-3 py-2 text-xs text-status-success hover:bg-status-success/10 flex items-center gap-2 font-bold"
            >
              <span>🔗</span> تجميع الأخشاب المحددة
            </button>
          )}
          {isUngroupable && (
            <button
              onClick={() => handleAction(() => ungroupSelectedSpars())}
              className="w-full text-right px-3 py-2 text-xs text-status-error hover:bg-status-error/10 flex items-center gap-2 font-bold"
            >
              <span>🔓</span> فك تجميع الأخشاب
            </button>
          )}
          <button
            onClick={() => handleAction(() => duplicateSelectedSpar())}
            className="w-full text-right px-3 py-2 text-xs text-txt-primary hover:bg-editor-hover flex items-center justify-between"
          >
            <span>تكرار ومضاعفة</span>
            {kbd('Shift+D')}
          </button>
          <button
            onClick={() => handleAction(() => alignSelectedSpar())}
            className="w-full text-right px-3 py-2 text-xs text-txt-primary hover:bg-editor-hover flex items-center justify-between"
          >
            <span>محاذاة الزاوية (Snap 90°)</span>
          </button>
          <button
            onClick={() => handleAction(() => dropSparToGround())}
            className="w-full text-right px-3 py-2 text-xs text-txt-primary hover:bg-editor-hover flex items-center justify-between"
          >
            <span>إنزال للأرض</span>
            {kbd('B')}
          </button>
          {selectedSpars.length === 1 && guidePoints.length >= 2 && (
            <button
              onClick={() => handleAction(() => {
                alignSparBetweenPoints(
                  selectedSpars[0].id,
                  guidePoints[0].position,
                  guidePoints[1].position,
                  { adjustLength: true }
                );
              })}
              className="w-full text-right px-3 py-2 text-xs text-accent hover:bg-editor-hover flex items-center justify-between font-bold border-t border-editor-divider/60"
            >
              <span>🎯 محاذاة بين نقطتي الدليل</span>
              <span className="text-[10px] text-cat-guide">7سم خلوص</span>
            </button>
          )}
          {selectedSpars.length >= 2 && (
            <>
              <div className="h-px bg-editor-divider my-1" />
              <div className="px-3 py-1 text-[11px] font-bold text-cat-lashing">
                🪢 ربط الأخشاب المحددة
              </div>
              <button
                onClick={() => handleAction(() => tieSelectedSpars('square'))}
                className="w-full text-right px-3 py-1.5 text-xs text-txt-primary hover:bg-editor-hover flex items-center gap-2"
              >
                <span>🪢</span> ربطة مربعة (Square)
              </button>
              <button
                onClick={() => handleAction(() => tieSelectedSpars('diagonal'))}
                className="w-full text-right px-3 py-1.5 text-xs text-txt-primary hover:bg-editor-hover flex items-center gap-2"
              >
                <span>🪢</span> ربطة قطرية (Diagonal)
              </button>
              <button
                onClick={() => handleAction(() => tieSelectedSpars('shear'))}
                className="w-full text-right px-3 py-1.5 text-xs text-txt-primary hover:bg-editor-hover flex items-center gap-2"
              >
                <span>🪢</span> ربطة قص (Shear)
              </button>
              {selectedSpars.length >= 3 && (
                <button
                  onClick={() => handleAction(() => tieSelectedSpars('tripod'))}
                  className="w-full text-right px-3 py-1.5 text-xs text-txt-primary hover:bg-editor-hover flex items-center gap-2"
                >
                  <span>🪢</span> ربطة ثلاثية (Tripod)
                </button>
              )}
            </>
          )}
          <div className="h-px bg-editor-divider my-1" />
          <button
            onClick={() => handleAction(() => deleteSelected())}
            className="w-full text-right px-3 py-2 text-xs text-status-error hover:bg-status-error/10 flex items-center justify-between font-bold"
          >
            <span>حذف الخشبة</span>
            {kbd('Del')}
          </button>
        </>
      )}

      {/* ═══ Lashing Context Menu ═══ */}
      {contextMenu.type === 'lashing' && (
        <>
          <div className="px-3 py-1 text-[11px] font-bold text-cat-lashing border-b border-editor-divider mb-1">
            إجراءات الربطة
          </div>
          <button
            onClick={() => handleAction(() => deleteSelected())}
            className="w-full text-right px-3 py-2 text-xs text-status-error hover:bg-status-error/10 flex items-center justify-between font-bold"
          >
            <span>✂️ فك وحذف الربطة</span>
            {kbd('Del')}
          </button>
        </>
      )}

      {/* ═══ Stake Context Menu ═══ */}
      {contextMenu.type === 'stake' && (
        <>
          <div className="px-3 py-1 text-[11px] font-bold text-cat-stake border-b border-editor-divider mb-1">
            إجراءات الوتد
          </div>
          <button
            onClick={() => handleAction(() => deleteSelected())}
            className="w-full text-right px-3 py-2 text-xs text-status-error hover:bg-status-error/10 flex items-center justify-between font-bold"
          >
            <span>🗑️ حذف الوتد</span>
            {kbd('Del')}
          </button>
        </>
      )}

      {/* ═══ GuyLine Context Menu ═══ */}
      {contextMenu.type === 'guyLine' && (
        <>
          <div className="px-3 py-1 text-[11px] font-bold text-cat-guyline border-b border-editor-divider mb-1">
            إجراءات حبل الشد
          </div>
          <button
            onClick={() => handleAction(() => deleteSelected())}
            className="w-full text-right px-3 py-2 text-xs text-status-error hover:bg-status-error/10 flex items-center justify-between font-bold"
          >
            <span>✂️ قطع وحذف الحبل</span>
            {kbd('Del')}
          </button>
        </>
      )}

      {/* ═══ GuidePoint Context Menu ═══ */}
      {contextMenu.type === 'guidePoint' && (
        <>
          <div className="px-3 py-1 text-[11px] font-bold text-cat-guide border-b border-editor-divider mb-1">
            إجراءات النقطة الدليلة
          </div>
          <button
            onClick={() => handleAction(() => deleteSelected())}
            className="w-full text-right px-3 py-2 text-xs text-status-error hover:bg-status-error/10 flex items-center justify-between font-bold"
          >
            <span>🗑️ حذف نقطة الدليل</span>
            {kbd('Del')}
          </button>
        </>
      )}

      {/* ═══ GuideLine Context Menu ═══ */}
      {contextMenu.type === 'guideLine' && (
        <>
          <div className="px-3 py-1 text-[11px] font-bold text-cat-guide border-b border-editor-divider mb-1">
            إجراءات الخط الدليلي
          </div>
          <button
            onClick={() => handleAction(() => deleteSelected())}
            className="w-full text-right px-3 py-2 text-xs text-status-error hover:bg-status-error/10 flex items-center justify-between font-bold"
          >
            <span>🗑️ حذف خط الدليل</span>
            {kbd('Del')}
          </button>
        </>
      )}
    </div>
  );
};

export default ContextMenu;
