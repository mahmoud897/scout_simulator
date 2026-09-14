import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Sounds } from '../utils/sound';

export const Sidebar: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [activeModal, setActiveModal] = useState<'boundary' | 'spawn' | 'snapping' | null>(null);

  const addSpar = useStore(state => state.addSpar);
  const addStake = useStore(state => state.addStake);
  const addGuidePoint = useStore(state => state.addGuidePoint);
  const addGuideLine = useStore(state => state.addGuideLine);
  const toggleBoundary = useStore(state => state.toggleBoundary);
  const dropSparToGround = useStore(state => state.dropSparToGround);
  
  const boundaryEnabled = useStore(state => state.boundaryEnabled);
  const boundaryWidth = useStore(state => state.boundaryWidth);
  const boundaryLength = useStore(state => state.boundaryLength);
  const boundaryAlignment = useStore(state => state.boundaryAlignment);
  const assumeAllInsideBoundary = useStore(state => state.assumeAllInsideBoundary);
  const toggleAssumeAllInsideBoundary = useStore(state => state.toggleAssumeAllInsideBoundary);
  const focusNextOutOfBoundsSpar = useStore(state => state.focusNextOutOfBoundsSpar);
  const selectInsideBoundarySpars = useStore(state => state.selectInsideBoundarySpars);
  const moveOutOfBoundsSparsInside = useStore(state => state.moveOutOfBoundsSparsInside);
  const setBoundaryDimensions = useStore(state => state.setBoundaryDimensions);
  const setBoundaryAlignment = useStore(state => state.setBoundaryAlignment);
  const addGuidePointAtOrigin = useStore(state => state.addGuidePointAtOrigin);

  const toggleSpawnZone = useStore(state => state.toggleSpawnZone);
  const spawnZoneEnabled = useStore(state => state.spawnZoneEnabled);
  const spawnZoneWidth = useStore(state => state.spawnZoneWidth);
  const spawnZoneLength = useStore(state => state.spawnZoneLength);
  const setSpawnZoneDimensions = useStore(state => state.setSpawnZoneDimensions);
  const spawnZoneVisible = useStore(state => state.spawnZoneVisible);
  const toggleSpawnZoneVisibility = useStore(state => state.toggleSpawnZoneVisibility);

  const gridSnappingEnabled = useStore(state => state.gridSnappingEnabled);
  const gridSize = useStore(state => state.gridSize);
  const toggleGridSnapping = useStore(state => state.toggleGridSnapping);
  const setGridSize = useStore(state => state.setGridSize);

  const angleSnappingEnabled = useStore(state => state.angleSnappingEnabled);
  const angleSize = useStore(state => state.angleSize);
  const toggleAngleSnapping = useStore(state => state.toggleAngleSnapping);
  const setAngleSize = useStore(state => state.setAngleSize);

  const modalRef = useRef<HTMLDivElement>(null);

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setActiveModal(null);
      }
    };
    if (activeModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeModal]);

  const sparsList = [
    { id: 'stave', length: '1م', name: 'عصا قصيرة', fullDesc: 'عصا كشفية (1 متر)', color: '#f59e0b', stroke: 2 },
    { id: 'medium', length: '3م', name: 'خشب متوسط', fullDesc: 'خشب هيكلي (3 أمتار)', color: '#d97706', stroke: 2.5 },
    { id: 'long', length: '4م', name: 'خشب طويل', fullDesc: 'خشب رئيسي (4 أمتار)', color: '#b45309', stroke: 3 },
    { id: 'xlong', length: '5م', name: 'طويل جداً', fullDesc: 'خشب ساريات (5 أمتار)', color: '#92400e', stroke: 3.5 },
  ];

  return (
    <>
      <aside 
        className={`dcc-panel flex flex-col justify-between py-2 border-l border-editor-border select-none z-30 transition-all duration-200 ${
          expanded ? 'w-56' : 'w-16'
        }`}
      >
        {/* Top: Section Switcher & Creation Items */}
        <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar px-2">
          
          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between px-2 py-1.5 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-editor-hover text-xs transition-colors"
            title={expanded ? 'طي القائمة' : 'توسيع القائمة'}
          >
            {expanded && <span className="font-bold text-[11px]">أدوات الإنشاء</span>}
            <div className={`p-1 rounded ${expanded ? '' : 'mx-auto'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${expanded ? 'rotate-0' : 'rotate-180'}`}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </div>
          </button>

          <div className="h-px bg-editor-divider my-0.5" />

          {/* Section 1: الأخشاب الكشفية */}
          <div className="flex flex-col gap-1">
            {expanded && (
              <span className="text-[10px] font-bold text-cat-spar uppercase tracking-wider px-1">
                الأخشاب الكشفية
              </span>
            )}
            
            {sparsList.map((spar) => (
              <button
                key={spar.id}
                onClick={() => { Sounds.playClick(); addSpar(spar.id); }}
                className={`group relative flex items-center gap-2.5 rounded-xl border border-transparent hover:border-cat-spar/30 bg-editor-surface/60 hover:bg-cat-spar/10 transition-all text-right ${
                  expanded ? 'px-3 py-2 w-full' : 'p-2 justify-center w-12 h-12 mx-auto'
                }`}
                title={!expanded ? `${spar.name} (${spar.length})` : undefined}
              >
                {/* Visual Spar Pillar Indicator */}
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] shrink-0 border"
                  style={{
                    backgroundColor: `${spar.color}20`,
                    borderColor: `${spar.color}50`,
                    color: spar.color,
                  }}
                >
                  {spar.length}
                </div>

                {expanded && (
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-txt-primary group-hover:text-cat-spar transition-colors truncate">
                      {spar.name}
                    </span>
                    <span className="text-[10px] text-txt-muted truncate">
                      {spar.fullDesc}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="h-px bg-editor-divider my-1" />

          {/* Section 2: الأوتاد وحبال الشد والإنزال */}
          <div className="flex flex-col gap-1">
            {expanded && (
              <span className="text-[10px] font-bold text-cat-stake uppercase tracking-wider px-1">
                التثبيت والأرض
              </span>
            )}

            {/* Stake Button */}
            <button
              onClick={() => { Sounds.playClick(); addStake(); }}
              className={`group flex items-center gap-2.5 rounded-xl border border-transparent hover:border-cat-stake/30 bg-editor-surface/60 hover:bg-cat-stake/10 transition-all text-right ${
                expanded ? 'px-3 py-2 w-full' : 'p-2 justify-center w-12 h-12 mx-auto'
              }`}
              title={!expanded ? 'وتد تثبيت أرضي [K]' : undefined}
            >
              <div className="w-7 h-7 rounded-lg bg-cat-stake/20 border border-cat-stake/40 text-cat-stake flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="12" y1="2" x2="12" y2="16" />
                  <polygon points="8,16 12,22 16,16" fill="currentColor" stroke="none" />
                </svg>
              </div>
              {expanded && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-txt-primary group-hover:text-cat-stake transition-colors truncate">
                    وتد تثبيت [K]
                  </span>
                  <span className="text-[10px] text-txt-muted truncate">
                    ربط حبال الشد بالأرض
                  </span>
                </div>
              )}
            </button>

            {/* Drop to Ground Button */}
            <button
              onClick={() => { Sounds.playClick(); dropSparToGround(); }}
              className={`group flex items-center gap-2.5 rounded-xl border border-transparent hover:border-accent/30 bg-editor-surface/60 hover:bg-accent/10 transition-all text-right ${
                expanded ? 'px-3 py-2 w-full' : 'p-2 justify-center w-12 h-12 mx-auto'
              }`}
              title={!expanded ? 'إنزال للسطح [B]' : undefined}
            >
              <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 text-accent flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="3" x2="12" y2="17" />
                  <polyline points="7 12 12 17 17 12" />
                  <line x1="4" y1="21" x2="20" y2="21" />
                </svg>
              </div>
              {expanded && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-txt-primary group-hover:text-accent transition-colors truncate">
                    إنزال للأرض [B]
                  </span>
                  <span className="text-[10px] text-txt-muted truncate">
                    محاذاة أسفل الخشبة مع الصفر
                  </span>
                </div>
              )}
            </button>
          </div>

          <div className="h-px bg-editor-divider my-1" />

          {/* Section 3: الدلائل والقياس */}
          <div className="flex flex-col gap-1">
            {expanded && (
              <span className="text-[10px] font-bold text-cat-guide uppercase tracking-wider px-1">
                الدلائل والقياس
              </span>
            )}

            {/* Guide Point */}
            <button
              onClick={() => { Sounds.playClick(); addGuidePoint(); }}
              className={`group flex items-center gap-2.5 rounded-xl border border-transparent hover:border-cat-guide/30 bg-editor-surface/60 hover:bg-cat-guide/10 transition-all text-right ${
                expanded ? 'px-3 py-2 w-full' : 'p-2 justify-center w-12 h-12 mx-auto'
              }`}
              title={!expanded ? 'نقطة دليل هندسي [P]' : undefined}
            >
              <div className="w-7 h-7 rounded-lg bg-cat-guide/20 border border-cat-guide/40 text-cat-guide flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="7" />
                  <line x1="12" y1="17" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="7" y2="12" />
                  <line x1="17" y1="12" x2="22" y2="12" />
                </svg>
              </div>
              {expanded && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-txt-primary group-hover:text-cat-guide transition-colors truncate">
                    نقطة دليل [P]
                  </span>
                  <span className="text-[10px] text-txt-muted truncate">
                    موقع مرجعي للبناء
                  </span>
                </div>
              )}
            </button>

            {/* Guide Line */}
            <button
              onClick={() => { Sounds.playClick(); addGuideLine(); }}
              className={`group flex items-center gap-2.5 rounded-xl border border-transparent hover:border-cat-guide/30 bg-editor-surface/60 hover:bg-cat-guide/10 transition-all text-right ${
                expanded ? 'px-3 py-2 w-full' : 'p-2 justify-center w-12 h-12 mx-auto'
              }`}
              title={!expanded ? 'خط دليل وقياس [L]' : undefined}
            >
              <div className="w-7 h-7 rounded-lg bg-cat-guide/20 border border-cat-guide/40 text-cat-guide flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeDasharray="3 2">
                  <line x1="4" y1="20" x2="20" y2="4" />
                  <circle cx="4" cy="20" r="2" fill="currentColor" strokeDasharray="none" />
                  <circle cx="20" cy="4" r="2" fill="currentColor" strokeDasharray="none" />
                </svg>
              </div>
              {expanded && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-txt-primary group-hover:text-cat-guide transition-colors truncate">
                    خط دليل [L]
                  </span>
                  <span className="text-[10px] text-txt-muted truncate">
                    مسار قياس بين نقطتين
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Section: Environment & Settings Controls */}
        <div className="flex flex-col gap-1 px-2 pt-2 border-t border-editor-divider">
          {expanded && (
            <span className="text-[10px] font-bold text-txt-muted uppercase tracking-wider px-1">
              البيئة والشبكة
            </span>
          )}

          {/* Boundary Settings Button */}
          <button
            onClick={() => { Sounds.playClick(); setActiveModal(activeModal === 'boundary' ? null : 'boundary'); }}
            className={`group flex items-center gap-2.5 rounded-xl border transition-all text-right ${
              boundaryEnabled 
                ? 'bg-status-info/15 border-status-info/40 text-status-info' 
                : 'bg-editor-surface/60 border-transparent text-txt-muted hover:text-txt-primary hover:bg-editor-hover'
            } ${expanded ? 'px-3 py-2 w-full' : 'p-2 justify-center w-12 h-12 mx-auto'}`}
            title="إعدادات حدود الأرض [G]"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>
            {expanded && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold truncate">حدود الأرض [G]</span>
                <span className="text-[10px] opacity-75 truncate">
                  {boundaryEnabled ? `${boundaryWidth}×${boundaryLength} م` : 'معطل'}
                </span>
              </div>
            )}
          </button>

          {/* Spawn Zone Button */}
          <button
            onClick={() => { Sounds.playClick(); setActiveModal(activeModal === 'spawn' ? null : 'spawn'); }}
            className={`group flex items-center gap-2.5 rounded-xl border transition-all text-right ${
              spawnZoneEnabled 
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400' 
                : 'bg-editor-surface/60 border-transparent text-txt-muted hover:text-txt-primary hover:bg-editor-hover'
            } ${expanded ? 'px-3 py-2 w-full' : 'p-2 justify-center w-12 h-12 mx-auto'}`}
            title="منطقة إسقاط القطع"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            {expanded && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold truncate">منطقة الإسقاط</span>
                <span className="text-[10px] opacity-75 truncate">
                  {spawnZoneEnabled ? `${spawnZoneWidth}×${spawnZoneLength} م` : 'معطل'}
                </span>
              </div>
            )}
          </button>

          {/* Snapping Button */}
          <button
            onClick={() => { Sounds.playClick(); setActiveModal(activeModal === 'snapping' ? null : 'snapping'); }}
            className={`group flex items-center gap-2.5 rounded-xl border transition-all text-right ${
              (gridSnappingEnabled || angleSnappingEnabled) 
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' 
                : 'bg-editor-surface/60 border-transparent text-txt-muted hover:text-txt-primary hover:bg-editor-hover'
            } ${expanded ? 'px-3 py-2 w-full' : 'p-2 justify-center w-12 h-12 mx-auto'}`}
            title="المغنطة والمحاذاة الذكية"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 10a7 7 0 0114 0v4a2 2 0 01-2 2h-1a2 2 0 01-2-2v-4a2 2 0 00-4 0v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4z" />
              </svg>
            </div>
            {expanded && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold truncate">المغنطة والمحاذاة</span>
                <span className="text-[10px] opacity-75 truncate">
                  {gridSnappingEnabled ? `${gridSize}م` : 'حر'} | {angleSnappingEnabled ? `${angleSize}°` : 'حر'}
                </span>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Modern Popovers (Opened on standard click, completely discoverable) */}
      {activeModal && (
        <div 
          ref={modalRef}
          className="fixed bottom-12 right-20 dcc-panel rounded-2xl p-4 shadow-card-elevated z-50 border border-editor-border/80 w-72 animate-in fade-in zoom-in-95 duration-150 text-right backdrop-blur-xl"
        >
          {/* Boundary Settings */}
          {activeModal === 'boundary' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-editor-divider pb-2">
                <h4 className="font-bold text-xs text-txt-primary flex items-center gap-1.5">
                  <span className="text-status-info">📐</span> حدود موقع البناء الكشفي
                </h4>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-txt-muted hover:text-txt-primary text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between bg-editor-surface/60 p-2.5 rounded-xl border border-editor-border">
                <span className="text-xs font-semibold text-txt-primary">تفعيل مراقبة الحدود</span>
                <input
                  type="checkbox"
                  checked={boundaryEnabled}
                  onChange={toggleBoundary}
                  className="w-4 h-4 cursor-pointer"
                />
              </div>

              {boundaryEnabled && (
                <div className="flex items-center justify-between bg-editor-surface/60 p-2.5 rounded-xl border border-editor-border">
                  <div className="flex flex-col pr-1">
                    <span className="text-xs font-bold text-txt-primary">اعتماد كل الخشب داخل المساحة</span>
                    <span className="text-[10px] text-txt-muted">السماح بتجميع الخشب خارج الأرض بدون احتساب تجاوز</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={assumeAllInsideBoundary}
                    onChange={(e) => toggleAssumeAllInsideBoundary(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
              )}

              {boundaryEnabled && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-txt-muted font-medium">العرض الأفقي (X):</span>
                      <span className="text-accent font-mono font-bold">{boundaryWidth} متر</span>
                    </div>
                    <input
                      type="range"
                      min="2" max="40" step="1"
                      value={boundaryWidth}
                      onChange={(e) => setBoundaryDimensions(parseInt(e.target.value), boundaryLength)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-txt-muted font-medium">الطول العمودي (Z):</span>
                      <span className="text-accent font-mono font-bold">{boundaryLength} متر</span>
                    </div>
                    <input
                      type="range"
                      min="2" max="40" step="1"
                      value={boundaryLength}
                      onChange={(e) => setBoundaryDimensions(boundaryWidth, parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Boundary Alignment Mode */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs text-txt-muted font-medium block">
                      محاذاة وبداية المنطقة على الشبكة:
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-editor-surface/80 p-1 rounded-xl border border-editor-border">
                      <button
                        type="button"
                        onClick={() => { Sounds.playClick(); setBoundaryAlignment('corner'); }}
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center ${
                          boundaryAlignment === 'corner'
                            ? 'bg-accent text-white shadow-xs'
                            : 'text-txt-muted hover:text-txt-primary hover:bg-editor-hover'
                        }`}
                        title="تبدأ من أول المربع عند زاوية الشبكة (0, 0)"
                      >
                        📐 أول المربع
                      </button>
                      <button
                        type="button"
                        onClick={() => { Sounds.playClick(); setBoundaryAlignment('center-grid'); }}
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center ${
                          boundaryAlignment === 'center-grid'
                            ? 'bg-accent text-white shadow-xs'
                            : 'text-txt-muted hover:text-txt-primary hover:bg-editor-hover'
                        }`}
                        title="توسيط مع خطوط المربعات الكاملة"
                      >
                        🎯 توسيط شبكي
                      </button>
                      <button
                        type="button"
                        onClick={() => { Sounds.playClick(); setBoundaryAlignment('center'); }}
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center ${
                          boundaryAlignment === 'center'
                            ? 'bg-accent text-white shadow-xs'
                            : 'text-txt-muted hover:text-txt-primary hover:bg-editor-hover'
                        }`}
                        title="توسيط رياضي حر حول المركز 0"
                      >
                        🔘 مركز حر
                      </button>
                    </div>
                    <span className="text-[10px] text-txt-muted block leading-tight px-0.5">
                      {boundaryAlignment === 'corner' && '✓ تبدأ الحدود من أول المربع (0, 0) وتتطابق حوافها مع خطوط الشبكة 100%.'}
                      {boundaryAlignment === 'center-grid' && '✓ تتمركز المنطقة مع وقوع كافة الحواف تماماً على خطوط المربعات.'}
                      {boundaryAlignment === 'center' && '✓ تتمركز المنطقة رياضياً حول نقطة الصفر.'}
                    </span>
                  </div>

              {/* Quick Origin Reference Point & Boundary Actions */}
                  <div className="pt-2 border-t border-editor-border/60 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        addGuidePointAtOrigin();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-cat-guide/15 hover:bg-cat-guide/25 border border-cat-guide/40 text-cat-guide text-xs font-bold transition-all shadow-xs"
                    >
                      <span>📍</span>
                      <span>وضع نقطة ريفرنس عند زاوية البداية (0, 0)</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          Sounds.playClick();
                          focusNextOutOfBoundsSpar();
                        }}
                        className="py-1.5 px-2 rounded-lg bg-status-warning/15 hover:bg-status-warning/25 text-amber-300 border border-status-warning/30 text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                        title="الانتقال للخشبة المتجاوزة وتحديدها"
                      >
                        <span>🎯 تركيز المتجاوز</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          Sounds.playClick();
                          selectInsideBoundarySpars();
                        }}
                        className="py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                        title="تحديد كافة الأخشاب الواقعة داخل حدود الأرض فقط"
                      >
                        <span>📦 تحديد خشب الأرض</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        moveOutOfBoundsSparsInside();
                      }}
                      className="w-full py-1.5 px-2 rounded-lg bg-editor-surface hover:bg-editor-hover text-txt-secondary border border-editor-border text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      title="محاذاة ونقل الأخشاب المتجاوزة لتقع بالكامل داخل الحيز"
                    >
                      <span>📥 إدخال الخشب المتجاوز لداخل الأرض</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Spawn Zone Settings */}
          {activeModal === 'spawn' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-editor-divider pb-2">
                <h4 className="font-bold text-xs text-txt-primary flex items-center gap-1.5">
                  <span className="text-blue-400">📦</span> منطقة إسقاط وتوليد القطع
                </h4>
                <button onClick={() => setActiveModal(null)} className="text-txt-muted hover:text-txt-primary text-xs p-1">✕</button>
              </div>

              <div className="flex items-center justify-between bg-editor-surface/60 p-2.5 rounded-xl border border-editor-border">
                <span className="text-xs font-semibold text-txt-primary">تحديد منطقة محددة للإنزال</span>
                <input
                  type="checkbox"
                  checked={spawnZoneEnabled}
                  onChange={toggleSpawnZone}
                />
              </div>

              {spawnZoneEnabled && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-txt-muted">إظهار المنطقة في المشهد:</span>
                    <input
                      type="checkbox"
                      checked={spawnZoneVisible}
                      onChange={toggleSpawnZoneVisibility}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-txt-muted">عرض المنطقة (X):</span>
                      <span className="text-accent font-mono font-bold">{spawnZoneWidth} متر</span>
                    </div>
                    <input
                      type="range"
                      min="1" max="25" step="1"
                      value={spawnZoneWidth}
                      onChange={(e) => setSpawnZoneDimensions(parseInt(e.target.value), spawnZoneLength)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-txt-muted">طول المنطقة (Z):</span>
                      <span className="text-accent font-mono font-bold">{spawnZoneLength} متر</span>
                    </div>
                    <input
                      type="range"
                      min="1" max="25" step="1"
                      value={spawnZoneLength}
                      onChange={(e) => setSpawnZoneDimensions(spawnZoneWidth, parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Snapping Settings */}
          {activeModal === 'snapping' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-editor-divider pb-2">
                <h4 className="font-bold text-xs text-txt-primary flex items-center gap-1.5">
                  <span className="text-amber-400">🧲</span> المغنطة والمحاذاة الذكية
                </h4>
                <button onClick={() => setActiveModal(null)} className="text-txt-muted hover:text-txt-primary text-xs p-1">✕</button>
              </div>

              {/* Grid Snapping */}
              <div className="space-y-2 bg-editor-surface/60 p-2.5 rounded-xl border border-editor-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-txt-primary">محاذاة الشبكة (Grid Snap)</span>
                  <input
                    type="checkbox"
                    checked={gridSnappingEnabled}
                    onChange={toggleGridSnapping}
                  />
                </div>

                {gridSnappingEnabled && (
                  <div className="pt-1 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-txt-muted">دقة القفز:</span>
                      <span className="text-accent font-mono font-bold">{gridSize} متر</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0.1, 0.25, 0.5, 1.0].map(val => (
                        <button
                          key={val}
                          onClick={() => setGridSize(val)}
                          className={`py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                            gridSize === val 
                              ? 'bg-accent border-accent text-white shadow-xs' 
                              : 'bg-editor-input border-editor-border hover:bg-editor-hover text-txt-secondary'
                          }`}
                        >
                          {val}م
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Angle Snapping */}
              <div className="space-y-2 bg-editor-surface/60 p-2.5 rounded-xl border border-editor-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-txt-primary">محاذاة الزوايا (Angle Snap)</span>
                  <input
                    type="checkbox"
                    checked={angleSnappingEnabled}
                    onChange={toggleAngleSnapping}
                  />
                </div>

                {angleSnappingEnabled && (
                  <div className="pt-1 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-txt-muted">درجة القفز:</span>
                      <span className="text-accent font-mono font-bold">{angleSize}°</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[15, 30, 45, 90].map(val => (
                        <button
                          key={val}
                          onClick={() => setAngleSize(val)}
                          className={`py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                            angleSize === val 
                              ? 'bg-accent border-accent text-white shadow-xs' 
                              : 'bg-editor-input border-editor-border hover:bg-editor-hover text-txt-secondary'
                          }`}
                        >
                          {val}°
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Sidebar;
