import React, { useState } from 'react';
import * as THREE from 'three';
import { useStore, computeBoundaryBounds, isSparOutOfBounds, isStakeOutOfBounds } from '../store/useStore';
import { Sounds } from '../utils/sound';

const EyeOpen = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosed = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const FocusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
  </svg>
);

const catColor: Record<string, string> = {
  spar: '#f59e0b',
  lashing: '#10b981',
  stake: '#a855f7',
  guyLine: '#38bdf8',
  guidePoint: '#2dd4bf',
  guideLine: '#2dd4bf',
};

export const Outliner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'bom'>('explorer');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'spar' | 'lashing' | 'stake' | 'guyLine' | 'guides' | 'outOfBounds'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [copyToast, setCopyToast] = useState(false);

  const spars = useStore(state => state.spars);
  const lashings = useStore(state => state.lashings);
  const stakes = useStore(state => state.stakes);
  const guyLines = useStore(state => state.guyLines);
  const guidePoints = useStore(state => state.guidePoints);
  const guideLines = useStore(state => state.guideLines);

  const selectedSpars = useStore(state => state.selectedSpars);
  const selectedLashing = useStore(state => state.selectedLashing);
  const selectedStake = useStore(state => state.selectedStake);
  const selectedGuyLine = useStore(state => state.selectedGuyLine);
  const selectedGuidePoint = useStore(state => state.selectedGuidePoint);
  const selectedGuideLine = useStore(state => state.selectedGuideLine);

  const toggleSparSelection = useStore(state => state.toggleSparSelection);
  const selectAssembly = useStore(state => state.selectAssembly);
  const selectLashing = useStore(state => state.selectLashing);
  const selectStake = useStore(state => state.selectStake);
  const selectGuyLine = useStore(state => state.selectGuyLine);
  const selectGuidePoint = useStore(state => state.selectGuidePoint);
  const selectGuideLine = useStore(state => state.selectGuideLine);
  const clearSelection = useStore(state => state.clearSelection);

  const setItemName = useStore(state => state.setItemName);
  const toggleItemVisibility = useStore(state => state.toggleItemVisibility);
  const setCameraFocusTarget = useStore(state => state.setCameraFocusTarget);
  const deleteSparById = useStore(state => state.deleteSparById);
  const breakLashingById = useStore(state => state.breakLashingById);
  const deleteStake = useStore(state => state.deleteStake);
  const deleteGuyLine = useStore(state => state.deleteGuyLine);
  const deleteGuidePoint = useStore(state => state.deleteGuidePoint);
  const deleteGuideLine = useStore(state => state.deleteGuideLine);
  const boundaryEnabled = useStore(state => state.boundaryEnabled);
  const boundaryWidth = useStore(state => state.boundaryWidth);
  const boundaryLength = useStore(state => state.boundaryLength);
  const boundaryAlignment = useStore(state => state.boundaryAlignment);
  const assumeAllInsideBoundary = useStore(state => state.assumeAllInsideBoundary);

  const bounds = computeBoundaryBounds(boundaryWidth, boundaryLength, boundaryAlignment);

  const allItems = [
    ...spars.map(s => ({
      id: s.id,
      name: s.name || s.type,
      visible: s.visible !== false,
      category: 'spar' as const,
      label: s.type === 'stave' ? 'عصا 1م' : s.type === 'medium' ? 'متوسط 3م' : s.type === 'long' ? 'طويل 4م' : 'سارية 5م',
      itemRef: s,
      isOutOfBounds: boundaryEnabled && !assumeAllInsideBoundary && isSparOutOfBounds(s, bounds)
    })),
    ...lashings.map(l => ({
      id: l.id,
      name: l.name || l.type,
      visible: l.visible !== false,
      category: 'lashing' as const,
      label: l.type === 'square' ? 'مربعة' : l.type === 'diagonal' ? 'قطرية' : l.type === 'shear' ? 'قص' : 'ثلاثية',
      itemRef: l,
      isOutOfBounds: false
    })),
    ...stakes.map(s => ({
      id: s.id,
      name: s.name || 'وتد أرضي',
      visible: s.visible !== false,
      category: 'stake' as const,
      label: 'وتد',
      itemRef: s,
      isOutOfBounds: boundaryEnabled && !assumeAllInsideBoundary && isStakeOutOfBounds(s, bounds)
    })),
    ...guyLines.map(g => ({
      id: g.id,
      name: g.name || 'حبل شد',
      visible: g.visible !== false,
      category: 'guyLine' as const,
      label: 'حبل',
      itemRef: g,
      isOutOfBounds: false
    })),
    ...guidePoints.map(p => ({
      id: p.id,
      name: p.name || 'نقطة دليل',
      visible: p.visible !== false,
      category: 'guidePoint' as const,
      label: 'نقطة',
      itemRef: p,
      isOutOfBounds: false
    })),
    ...guideLines.map(l => ({
      id: l.id,
      name: l.name || 'خط دليل',
      visible: l.visible !== false,
      category: 'guideLine' as const,
      label: 'خط',
      itemRef: l,
      isOutOfBounds: false
    }))
  ];

  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.id.includes(search);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'outOfBounds' && item.isOutOfBounds) ||
      item.category === filter ||
      (filter === 'guides' && (item.category === 'guidePoint' || item.category === 'guideLine'));
    return matchesSearch && matchesFilter;
  });

  const isSelected = (item: typeof allItems[0]) => {
    if (item.category === 'spar') return selectedSpars.some(s => s.id === item.id);
    if (item.category === 'lashing') return selectedLashing?.id === item.id;
    if (item.category === 'stake') return selectedStake?.id === item.id;
    if (item.category === 'guyLine') return selectedGuyLine?.id === item.id;
    if (item.category === 'guidePoint') return selectedGuidePoint?.id === item.id;
    if (item.category === 'guideLine') return selectedGuideLine?.id === item.id;
    return false;
  };

  const handleItemClick = (item: typeof allItems[0], e: React.MouseEvent) => {
    Sounds.playClick();
    if (item.category === 'spar') {
      const isMulti = e.shiftKey;
      const forceSingle = e.altKey;
      toggleSparSelection(item.itemRef, isMulti, forceSingle);
    } else {
      if (item.category === 'lashing') selectLashing(item.itemRef);
      else if (item.category === 'stake') selectStake(item.itemRef);
      else if (item.category === 'guyLine') selectGuyLine(item.itemRef);
      else if (item.category === 'guidePoint') selectGuidePoint(item.itemRef);
      else if (item.category === 'guideLine') selectGuideLine(item.itemRef);
    }
  };

  const handleItemDoubleClick = (item: typeof allItems[0], e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.category === 'spar') {
      selectAssembly(item.itemRef);
    }
  };

  const handleSaveRename = (item: typeof allItems[0]) => {
    if (editingValue.trim()) {
      setItemName(item.category, item.id, editingValue.trim());
    }
    setEditingId(null);
  };

  const handleFocus = (item: typeof allItems[0], e: React.MouseEvent) => {
    e.stopPropagation();
    Sounds.playClick();
    let pos: THREE.Vector3 | null = null;
    if (item.category === 'spar' || item.category === 'stake' || item.category === 'lashing' || item.category === 'guidePoint') {
      pos = item.itemRef.position;
    } else if (item.category === 'guideLine') {
      pos = new THREE.Vector3().addVectors(item.itemRef.pointA, item.itemRef.pointB).multiplyScalar(0.5);
    } else if (item.category === 'guyLine') {
      const sparRef = spars.find(s => s.id === item.itemRef.sparId);
      const stakeRef = stakes.find(s => s.id === item.itemRef.stakeId);
      if (sparRef && stakeRef) {
        pos = new THREE.Vector3().addVectors(sparRef.position, stakeRef.position).multiplyScalar(0.5);
      }
    }
    if (pos) setCameraFocusTarget(pos.clone());
  };

  const handleToggleVisibility = (item: typeof allItems[0], e: React.MouseEvent) => {
    e.stopPropagation();
    Sounds.playClick();
    toggleItemVisibility(item.category, item.id);
  };

  const handleDelete = (item: typeof allItems[0], e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.category === 'spar') deleteSparById(item.id, true);
    else if (item.category === 'lashing') breakLashingById(item.id);
    else if (item.category === 'stake') deleteStake(item.id, true);
    else if (item.category === 'guyLine') deleteGuyLine(item.id, true);
    else if (item.category === 'guidePoint') deleteGuidePoint(item.id, true);
    else if (item.category === 'guideLine') deleteGuideLine(item.id, true);
  };

  const outOfBoundsCount = allItems.filter(i => i.isOutOfBounds).length;

  const filterBtns: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'الكل' },
    ...(outOfBoundsCount > 0 ? [{ key: 'outOfBounds' as const, label: `⚠️ خارج الأرض (${outOfBoundsCount})` }] : []),
    { key: 'spar', label: 'خشب' },
    { key: 'lashing', label: 'ربطات' },
    { key: 'stake', label: 'أوتاد' },
    { key: 'guyLine', label: 'حبال' },
    { key: 'guides', label: 'أدلة' },
  ];

  return (
    <div className="dcc-panel flex-1 flex flex-col overflow-hidden select-none border-t border-editor-border">
      
      {/* Modern Tab Bar */}
      <div className="flex bg-editor-header border-b border-editor-border p-1 gap-1">
        <button
          onClick={() => setActiveTab('explorer')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'explorer' 
              ? 'bg-editor-surface text-txt-primary shadow-xs border border-editor-border/80' 
              : 'text-txt-muted hover:text-txt-primary hover:bg-editor-hover/50'
          }`}
        >
          <span>📁</span>
          <span>شجرة العناصر ({allItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('bom')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'bom' 
              ? 'bg-editor-surface text-txt-primary shadow-xs border border-editor-border/80' 
              : 'text-txt-muted hover:text-txt-primary hover:bg-editor-hover/50'
          }`}
        >
          <span>📋</span>
          <span>قائمة المواد (BOM)</span>
        </button>
      </div>

      {activeTab === 'explorer' ? (
        <>
          {/* Search bar */}
          <div className="p-2 border-b border-editor-border">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في العناصر..."
                className="dcc-input w-full pr-8 text-xs py-1.5 rounded-lg"
              />
              <span className="absolute right-2.5 top-2 text-txt-muted text-xs pointer-events-none">
                🔍
              </span>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute left-2 top-2 text-txt-muted hover:text-txt-primary text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-1 px-2 py-1.5 border-b border-editor-border overflow-x-auto no-scrollbar">
            {filterBtns.map(f => (
              <button
                key={f.key}
                onClick={() => { Sounds.playClick(); setFilter(f.key); }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${
                  filter === f.key 
                    ? 'bg-accent text-white shadow-xs' 
                    : 'bg-editor-surface/80 text-txt-muted hover:text-txt-primary hover:bg-editor-hover border border-editor-border/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Items Tree */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="text-xs text-txt-muted text-center py-8">
                لا توجد عناصر مطابقة
              </div>
            ) : (
              filteredItems.map(item => {
                const active = isSelected(item);
                const editing = editingId === item.id;
                const color = catColor[item.category] || '#94a3b8';

                return (
                  <div
                    key={item.id}
                    onClick={(e) => handleItemClick(item, e)}
                    onDoubleClick={(e) => handleItemDoubleClick(item, e)}
                    className={`outliner-item group ${active ? 'selected !bg-accent/20 border-accent/40 text-white' : ''}`}
                  >
                    {/* Category dot */}
                    <div className="color-dot" style={{ backgroundColor: color }} />

                    {/* Name or Rename Input */}
                    {editing ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleSaveRename(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(item);
                          else if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="dcc-input text-xs flex-1 py-0.5"
                      />
                    ) : (
                      <span
                        onDoubleClick={() => { setEditingId(item.id); setEditingValue(item.name); }}
                        className="text-xs font-medium truncate flex-1"
                        title="انقر مرتين لإعادة التسمية"
                      >
                        {item.name}
                      </span>
                    )}

                    {/* Out of bounds badge */}
                    {item.isOutOfBounds && (
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded bg-status-warning/20 text-amber-300 border border-status-warning/40 font-bold shrink-0 animate-pulse"
                        title="هذا العنصر متجاوز لحدود موقع الأرض"
                      >
                        ⚠️ خارج الأرض
                      </span>
                    )}

                    {/* Tag badge */}
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-editor-surface border border-editor-border/60 text-txt-muted shrink-0 font-mono">
                      {item.label}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 mr-1">
                      <button
                        onClick={(e) => handleFocus(item, e)}
                        className="p-1 rounded hover:bg-editor-hover text-txt-muted hover:text-accent transition-colors"
                        title="تركيز الكاميرا"
                      >
                        <FocusIcon />
                      </button>
                      <button
                        onClick={(e) => handleToggleVisibility(item, e)}
                        className={`p-1 rounded hover:bg-editor-hover transition-colors ${item.visible ? 'text-txt-secondary' : 'text-txt-disabled'}`}
                        title={item.visible ? 'إخفاء' : 'إظهار'}
                      >
                        {item.visible ? <EyeOpen /> : <EyeClosed />}
                      </button>
                      <button
                        onClick={(e) => handleDelete(item, e)}
                        className="p-1 rounded hover:bg-status-error/15 text-txt-muted hover:text-status-error transition-colors"
                        title="حذف"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-editor-border text-[11px] text-txt-muted bg-editor-header">
            <span>إجمالي العناصر: {allItems.length}</span>
            {selectedSpars.length > 0 && (
              <button
                onClick={() => { Sounds.playClick(); clearSelection(); }}
                className="text-accent hover:underline font-bold"
              >
                إلغاء التحديد ({selectedSpars.length})
              </button>
            )}
          </div>
        </>
      ) : (
        /* ═══ BOM (Bill of Materials) Tab ═══ */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {spars.length === 0 && lashings.length === 0 && stakes.length === 0 ? (
              <div className="text-xs text-txt-muted text-center py-12">
                المشهد فارغ حالياً. أضف أخشاباً أو ابنِ قالباً لعرض قائمة المواد.
              </div>
            ) : (
              <>
                {/* Summary Metric Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-editor-surface/80 p-2.5 rounded-xl border border-editor-border text-center">
                    <span className="text-[10px] text-txt-muted block">الأخشاب</span>
                    <span className="text-sm font-bold font-mono text-cat-spar">{spars.length}</span>
                  </div>
                  <div className="bg-editor-surface/80 p-2.5 rounded-xl border border-editor-border text-center">
                    <span className="text-[10px] text-txt-muted block">طول الحبال</span>
                    <span className="text-sm font-bold font-mono text-status-success">
                      {(() => {
                        let lashLen = 0;
                        lashings.forEach(l => {
                          if (l.type === 'square') lashLen += 5;
                          else if (l.type === 'diagonal') lashLen += 6;
                          else if (l.type === 'shear') lashLen += 4;
                          else if (l.type === 'tripod') lashLen += 8;
                        });
                        let guyLen = 0;
                        guyLines.forEach(g => {
                          const spar = spars.find(s => s.id === g.sparId);
                          const stake = stakes.find(s => s.id === g.stakeId);
                          if (spar && stake) {
                            const localY = new THREE.Vector3(0, 1, 0).applyQuaternion(spar.quaternion).normalize();
                            const attachmentPoint = spar.position.clone().addScaledVector(localY, g.sparHeightOffset);
                            const dist = attachmentPoint.distanceTo(stake.position);
                            guyLen += (dist + 1.0);
                          }
                        });
                        return `${(lashLen + guyLen).toFixed(1)}م`;
                      })()}
                    </span>
                  </div>
                  <div className="bg-editor-surface/80 p-2.5 rounded-xl border border-editor-border text-center">
                    <span className="text-[10px] text-txt-muted block">الوزن التقريبي</span>
                    <span className="text-sm font-bold font-mono text-status-warning">
                      {(() => {
                        let totalMass = 0;
                        spars.forEach(s => {
                          const volume = Math.PI * Math.pow(s.radius, 2) * s.length;
                          totalMass += volume * 800;
                        });
                        totalMass += stakes.length * 0.5;
                        return `${totalMass.toFixed(0)} كجم`;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Spars Breakdown */}
                {spars.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-cat-spar flex items-center gap-1 border-b border-editor-border pb-1">
                      <span>🪵</span> مواصفات قطع الخشب:
                    </div>
                    <div className="space-y-1">
                      {Object.values(
                        spars.reduce<Record<string, { count: number; length: number; radius: number; label: string }>>((acc, s) => {
                          const label = s.type === 'stave' ? 'عصا قصيرة' : s.type === 'medium' ? 'خشب متوسط' : s.type === 'long' ? 'خشب طويل' : 'خشب طويل جداً';
                          const key = `${s.length.toFixed(1)}-${s.radius.toFixed(3)}`;
                          if (!acc[key]) {
                            acc[key] = { count: 0, length: s.length, radius: s.radius, label };
                          }
                          acc[key].count++;
                          return acc;
                        }, {})
                      ).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-editor-surface/60 px-2.5 py-1.5 rounded-lg border border-editor-border/60">
                          <span className="text-txt-primary font-semibold">
                            {item.label} ({item.length.toFixed(1)}م × {Math.round(item.radius * 2 * 100)}سم)
                          </span>
                          <span className="font-mono text-accent font-bold px-2 py-0.5 bg-accent/10 rounded">
                            {item.count} قطع
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lashings Breakdown */}
                {lashings.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-cat-lashing flex items-center gap-1 border-b border-editor-border pb-1">
                      <span>🪢</span> الربطات والعقد الكشفية:
                    </div>
                    <div className="space-y-1">
                      {Object.entries(
                        lashings.reduce<Record<string, number>>((acc, l) => {
                          const label = l.type === 'square' ? 'ربطة مربعة' : l.type === 'diagonal' ? 'ربطة قطرية' : l.type === 'shear' ? 'ربطة قص' : 'ربطة ثلاثية';
                          acc[label] = (acc[label] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([label, count], idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-editor-surface/60 px-2.5 py-1.5 rounded-lg border border-editor-border/60">
                          <span className="text-txt-primary font-semibold">{label}</span>
                          <span className="font-mono text-cat-lashing font-bold px-2 py-0.5 bg-cat-lashing/10 rounded">
                            {count} ربطات
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Anchors */}
                {(stakes.length > 0 || guyLines.length > 0) && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-cat-stake flex items-center gap-1 border-b border-editor-border pb-1">
                      <span>⚓</span> أدوات التثبيت:
                    </div>
                    <div className="space-y-1">
                      {stakes.length > 0 && (
                        <div className="flex justify-between items-center text-xs bg-editor-surface/60 px-2.5 py-1.5 rounded-lg border border-editor-border/60">
                          <span className="text-txt-primary font-semibold">أوتاد أرضية خشبية</span>
                          <span className="font-mono text-cat-stake font-bold">{stakes.length} أوتاد</span>
                        </div>
                      )}
                      {guyLines.length > 0 && (
                        <div className="flex justify-between items-center text-xs bg-editor-surface/60 px-2.5 py-1.5 rounded-lg border border-editor-border/60">
                          <span className="text-txt-primary font-semibold">حبال شد وتثبيت</span>
                          <span className="font-mono text-cat-guyline font-bold">{guyLines.length} حبال</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* BOM Action Buttons */}
          <div className="p-2 border-t border-editor-border flex gap-2 bg-editor-header">
            <button
              onClick={() => {
                Sounds.playClick();
                let text = `📋 تقرير قائمة المواد الهندسية (BOM):\n`;
                text += `=====================================\n`;
                text += `🪵 الأخشاب:\n`;
                const woodCounts: Record<string, number> = {};
                spars.forEach(s => {
                  const desc = `${s.type === 'stave' ? 'عصا قصيرة' : s.type === 'medium' ? 'خشب متوسط' : s.type === 'long' ? 'خشب طويل' : 'خشب طويل جداً'} (${s.length.toFixed(1)}م × ${Math.round(s.radius*2*100)}سم)`;
                  woodCounts[desc] = (woodCounts[desc] || 0) + 1;
                });
                Object.entries(woodCounts).forEach(([desc, count]) => { text += `- ${desc}: ${count} قطع\n`; });
                
                text += `\n🪢 الربطات:\n`;
                const lashCounts: Record<string, number> = {};
                lashings.forEach(l => {
                  const label = l.type === 'square' ? 'ربطة مربعة' : l.type === 'diagonal' ? 'ربطة قطرية' : l.type === 'shear' ? 'ربطة قص' : 'ربطة ثلاثية';
                  lashCounts[label] = (lashCounts[label] || 0) + 1;
                });
                Object.entries(lashCounts).forEach(([label, count]) => { text += `- ${label}: ${count} ربطات\n`; });
                
                if (stakes.length > 0) text += `\n📍 أوتاد التثبيت: ${stakes.length}\n`;
                if (guyLines.length > 0) text += `🧵 حبال الشد: ${guyLines.length}\n`;
                
                navigator.clipboard.writeText(text);
                setCopyToast(true);
                setTimeout(() => setCopyToast(false), 2000);
              }}
              className="dcc-btn text-xs font-bold flex-1 py-2 rounded-lg bg-accent/15 hover:bg-accent/25 text-accent border border-accent/40"
            >
              {copyToast ? '✓ تم النسخ' : '📋 نسخ التقرير'}
            </button>
            <button
              onClick={() => {
                Sounds.playClick();
                window.print();
              }}
              className="dcc-btn text-xs font-bold py-2 px-4 rounded-lg bg-editor-hover text-txt-primary"
            >
              🖨️ طباعة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Outliner;
