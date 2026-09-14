import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import * as THREE from 'three';
import { Sounds } from '../utils/sound';
import { checkWoodNearPosition } from '../utils/math';

// Modern chevron icon
const Chevron = ({ open }: { open: boolean }) => (
  <svg className={`chevron w-3.5 h-3.5 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// Collapsible section component
const Section: React.FC<{ title: string; icon?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode; color?: string }> = 
  ({ title, icon, defaultOpen = true, children, color }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2 bg-editor-surface/40 rounded-xl border border-editor-border/50 overflow-hidden">
      <div 
        className={`dcc-section-header !border-none !rounded-none ${!open ? 'collapsed' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <Chevron open={open} />
        {icon}
        <span className="text-xs font-bold" style={color ? { color } : undefined}>{title}</span>
      </div>
      {open && <div className="p-2.5 pt-1 space-y-2">{children}</div>}
    </div>
  );
};

// Property row component
const PropRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="dcc-prop-row">
    <span className="dcc-prop-label">{label}</span>
    <div className="dcc-prop-value">{children}</div>
  </div>
);

// Interactive single axis numeric input with typing buffer
const NumericAxisInput: React.FC<{
  axis: 'x' | 'y' | 'z';
  value: number;
  labelColor: string;
  onChange?: (val: number) => void;
  step?: number;
}> = ({ axis, value, labelColor, onChange, step = 0.05 }) => {
  const [localText, setLocalText] = useState<string | null>(null);

  const displayVal = localText !== null ? localText : value.toFixed(2);

  const handleCommit = (str: string) => {
    const num = parseFloat(str);
    if (!isNaN(num) && onChange && Number.isFinite(num)) {
      onChange(num);
    }
    setLocalText(null);
  };

  return (
    <div className="flex-1 relative">
      <input
        type={onChange ? "number" : "text"}
        step={step}
        readOnly={!onChange}
        value={displayVal}
        onFocus={() => {
          if (onChange) setLocalText(value.toFixed(2));
        }}
        onChange={(e) => {
          if (!onChange) return;
          setLocalText(e.target.value);
          const num = parseFloat(e.target.value);
          if (!isNaN(num) && Number.isFinite(num)) {
            onChange(num);
          }
        }}
        onBlur={(e) => {
          handleCommit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleCommit((e.target as HTMLInputElement).value);
          } else if (e.key === 'Escape') {
            setLocalText(null);
          }
        }}
        className={`dcc-num-input axis-${axis} text-xs pl-4 pr-1`}
      />
      <span className={`absolute top-1 left-1.5 text-[9px] font-mono select-none ${labelColor}`}>{axis.toUpperCase()}</span>
    </div>
  );
};

// Interactive XYZ display with editable numeric inputs and strictly enforced LTR
const XYZDisplay: React.FC<{
  x: number;
  y: number;
  z: number;
  onChange?: (axis: 'x' | 'y' | 'z', val: number) => void;
  step?: number;
}> = ({ x, y, z, onChange, step = 0.05 }) => {
  return (
    <div className="flex gap-1.5 flex-1" dir="ltr">
      <NumericAxisInput
        axis="x"
        value={x}
        labelColor="text-red-400/70"
        onChange={onChange ? (val) => onChange('x', val) : undefined}
        step={step}
      />
      <NumericAxisInput
        axis="y"
        value={y}
        labelColor="text-emerald-400/70"
        onChange={onChange ? (val) => onChange('y', val) : undefined}
        step={step}
      />
      <NumericAxisInput
        axis="z"
        value={z}
        labelColor="text-sky-400/70"
        onChange={onChange ? (val) => onChange('z', val) : undefined}
        step={step}
      />
    </div>
  );
};

// Nudge button declared outside of render to preserve component identity
const NudgeBtn: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button 
    onClick={onClick} 
    className="flex-1 py-1 text-[11px] font-mono font-bold bg-editor-input border border-editor-border rounded-lg hover:bg-editor-hover hover:border-accent text-txt-primary transition-all active:scale-95"
  >
    {label}
  </button>
);

// Small action button
const ActionBtn: React.FC<{ onClick: () => void; children: React.ReactNode; color?: string; fullWidth?: boolean; variant?: 'default' | 'primary' | 'danger' }> = 
  ({ onClick, children, fullWidth, variant = 'default' }) => {
  let styleClass = "dcc-btn text-xs font-bold py-1.5 px-3 rounded-lg shadow-xs transition-all";
  if (variant === 'primary') {
    styleClass += " bg-gradient-to-r from-accent to-wood-600 hover:from-accent-hover hover:to-wood-500 text-white border-accent/40 shadow-glow-accent";
  } else if (variant === 'danger') {
    styleClass += " bg-status-error/15 hover:bg-status-error/25 text-status-error border-status-error/40";
  }
  return (
    <button 
      onClick={onClick} 
      className={`${styleClass} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
};

export const InfoPanel: React.FC = () => {
  const selectedSpars = useStore(state => state.selectedSpars);
  const selectedLashing = useStore(state => state.selectedLashing);
  const lashingGraph = useStore(state => state.lashingGraph);
  
  const selectedStake = useStore(state => state.selectedStake);
  const selectedGuyLine = useStore(state => state.selectedGuyLine);
  
  const selectedGuidePoint = useStore(state => state.selectedGuidePoint);
  const selectedGuideLine = useStore(state => state.selectedGuideLine);
  const selectedSourceSparPoint = useStore(state => state.selectedSourceSparPoint);
  const selectedTargetPoint = useStore(state => state.selectedTargetPoint);
  
  const deleteGuidePoint = useStore(state => state.deleteGuidePoint);
  const deleteGuideLine = useStore(state => state.deleteGuideLine);
  const updateGuidePointPosition = useStore(state => state.updateGuidePointPosition);
  const updateGuideLinePointPosition = useStore(state => state.updateGuideLinePointPosition);
  const addGuideLine = useStore(state => state.addGuideLine);
  const moveSparToTarget = useStore(state => state.moveSparToTarget);
  const dropSparToGround = useStore(state => state.dropSparToGround);
  const selectSourceSparPoint = useStore(state => state.selectSourceSparPoint);
  const selectTargetPoint = useStore(state => state.selectTargetPoint);
  
  const duplicateSelectedSpar = useStore(state => state.duplicateSelectedSpar);
  const alignSelectedSpar = useStore(state => state.alignSelectedSpar);
  const updateSparDimensions = useStore(state => state.updateSparDimensions);
  const groupSelectedSpars = useStore(state => state.groupSelectedSpars);
  const ungroupSelectedSpars = useStore(state => state.ungroupSelectedSpars);

  const nudgeSelectedSpars = useStore(state => state.nudgeSelectedSpars);
  const rotateSelectedSpars = useStore(state => state.rotateSelectedSpars);
  const snapSparPointToTarget = useStore(state => state.snapSparPointToTarget);
  const addGuidePointAtPosition = useStore(state => state.addGuidePointAtPosition);
  const setSparPosition = useStore(state => state.setSparPosition);
  const setSparRotationEuler = useStore(state => state.setSparRotationEuler);
  const tieSelectedSpars = useStore(state => state.tieSelectedSpars);
  const gizmoSpace = useStore(state => state.gizmoSpace);
  const toggleGizmoSpace = useStore(state => state.toggleGizmoSpace);
  
  const guidePoints = useStore(state => state.guidePoints);
  const stakes = useStore(state => state.stakes);

  const startGuyLinePlacement = useStore(state => state.startGuyLinePlacement);
  const cancelGuyLinePlacement = useStore(state => state.cancelGuyLinePlacement);
  const guyLinePlacementActive = useStore(state => state.guyLinePlacementActive);
  const guyLineSourceSparId = useStore(state => state.guyLineSourceSparId);
  const setGuyLineTension = useStore(state => state.setGuyLineTension);
  const deleteGuyLine = useStore(state => state.deleteGuyLine);
  const deleteStake = useStore(state => state.deleteStake);
  const createLinearArray = useStore(state => state.createLinearArray);
  const dropFlatEnabled = useStore(state => state.dropFlatEnabled);
  const setDropFlatEnabled = useStore(state => state.setDropFlatEnabled);

  const [arrayCount, setArrayCount] = useState(3);
  const [arrayDistance, setArrayDistance] = useState(1.0);
  const [arrayAxis, setArrayAxis] = useState<'x' | 'y' | 'z'>('x');

  // Two-Point Alignment & Span State
  const alignSparBetweenPoints = useStore(state => state.alignSparBetweenPoints);
  const spars = useStore(state => state.spars);
  const lashingEndOffset = useStore(state => state.lashingEndOffset);
  const guideLines = useStore(state => state.guideLines);

  const [startTargetId, setStartTargetId] = useState<string>('');
  const [endTargetId, setEndTargetId] = useState<string>('');
  const [customOffsetStart, setCustomOffsetStart] = useState<boolean | null>(null);
  const [customOffsetEnd, setCustomOffsetEnd] = useState<boolean | null>(null);
  const [fitLengthEnabled, setFitLengthEnabled] = useState(true);
  const [autoTieLashing, setAutoTieLashing] = useState(true);

  interface SpanTargetItem {
    id: string;
    type: 'guidePoint' | 'stake' | 'guideLineA' | 'guideLineB';
    label: string;
    position: THREE.Vector3;
  }

  const availableTargets: SpanTargetItem[] = useMemo(() => {
    const items: SpanTargetItem[] = [];
    guidePoints.forEach((pt, idx) => {
      items.push({
        id: `gp_${pt.id}`,
        type: 'guidePoint',
        label: pt.name || `نقطة دليل ${idx + 1}`,
        position: pt.position
      });
    });
    stakes.forEach((stk, idx) => {
      items.push({
        id: `stk_${stk.id}`,
        type: 'stake',
        label: stk.name || `وتد تثبيت ${idx + 1}`,
        position: stk.position
      });
    });
    guideLines.forEach((gl, idx) => {
      items.push({
        id: `gl_${gl.id}_A`,
        type: 'guideLineA',
        label: `${gl.name || `خط دليل ${idx + 1}`} (طرف أ)`,
        position: gl.pointA
      });
      items.push({
        id: `gl_${gl.id}_B`,
        type: 'guideLineB',
        label: `${gl.name || `خط دليل ${idx + 1}`} (طرف ب)`,
        position: gl.pointB
      });
    });
    return items;
  }, [guidePoints, stakes, guideLines]);

  // Auto-initialize start and end targets if not selected and targets available
  useEffect(() => {
    if (availableTargets.length >= 2) {
      if (!startTargetId || !availableTargets.some(t => t.id === startTargetId)) {
        setStartTargetId(availableTargets[0].id);
      }
      if (!endTargetId || !availableTargets.some(t => t.id === endTargetId)) {
        setEndTargetId(availableTargets[1].id);
      }
    } else if (availableTargets.length === 1) {
      if (!startTargetId || !availableTargets.some(t => t.id === startTargetId)) {
        setStartTargetId(availableTargets[0].id);
      }
    }
  }, [availableTargets, startTargetId, endTargetId]);

  const selectedStartTarget = availableTargets.find(t => t.id === startTargetId);
  const selectedEndTarget = availableTargets.find(t => t.id === endTargetId);
  const activeSpar = selectedSpars[0];

  const woodAtStart = useMemo(() => {
    if (!selectedStartTarget || !activeSpar) return { hasWood: false };
    const otherSpars = spars.filter(s => s.id !== activeSpar.id);
    return checkWoodNearPosition(selectedStartTarget.position, otherSpars, activeSpar.id);
  }, [selectedStartTarget, activeSpar, spars]);

  const woodAtEnd = useMemo(() => {
    if (!selectedEndTarget || !activeSpar) return { hasWood: false };
    const otherSpars = spars.filter(s => s.id !== activeSpar.id);
    return checkWoodNearPosition(selectedEndTarget.position, otherSpars, activeSpar.id);
  }, [selectedEndTarget, activeSpar, spars]);

  const effectiveOffsetStart = customOffsetStart !== null ? customOffsetStart : woodAtStart.hasWood;
  const effectiveOffsetEnd = customOffsetEnd !== null ? customOffsetEnd : woodAtEnd.hasWood;

  const targetDistance = useMemo(() => {
    if (!selectedStartTarget || !selectedEndTarget) return 0;
    return selectedStartTarget.position.distanceTo(selectedEndTarget.position);
  }, [selectedStartTarget, selectedEndTarget]);

  const finalCalculatedLength = useMemo(() => {
    if (targetDistance <= 0) return 0;
    return targetDistance + (effectiveOffsetStart ? lashingEndOffset : 0) + (effectiveOffsetEnd ? lashingEndOffset : 0);
  }, [targetDistance, effectiveOffsetStart, effectiveOffsetEnd, lashingEndOffset]);

  const handleExecuteSpan = () => {
    if (!activeSpar || !selectedStartTarget || !selectedEndTarget) return;
    if (selectedStartTarget.id === selectedEndTarget.id) return;

    alignSparBetweenPoints(
      activeSpar.id,
      selectedStartTarget.position,
      selectedEndTarget.position,
      {
        adjustLength: fitLengthEnabled,
        hasWoodAtStart: effectiveOffsetStart,
        hasWoodAtEnd: effectiveOffsetEnd,
        startOffset: effectiveOffsetStart ? lashingEndOffset : 0,
        endOffset: effectiveOffsetEnd ? lashingEndOffset : 0,
        autoLash: autoTieLashing
      }
    );
  };

  const translateSparType = (type: string) => {
    switch (type) {
      case 'stave': return 'عصا قصيرة (1م)';
      case 'medium': return 'خشب متوسط (3م)';
      case 'long': return 'خشب طويل (4م)';
      case 'xlong': return 'خشب طويل جداً (5م)';
      default: return type;
    }
  };

  const translateLashingType = (type: string) => {
    switch (type) {
      case 'square': return 'ربطة مربعة (Square)';
      case 'diagonal': return 'ربطة قطرية (Diagonal)';
      case 'shear': return 'ربطة قص (Shear)';
      case 'tripod': return 'ربطة ثلاثية (Tripod)';
      default: return type;
    }
  };

  const hasSelection = selectedSpars.length > 0 || selectedLashing !== null || selectedStake !== null || selectedGuyLine !== null || selectedGuidePoint !== null || selectedGuideLine !== null || selectedSourceSparPoint !== null;

  return (
    <div className="dcc-panel flex-1 flex flex-col overflow-hidden select-none" style={{ borderTop: 'none' }}>
      
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-editor-header border-b border-editor-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xs">
            ⚙️
          </div>
          <span className="text-xs font-bold text-txt-primary">خصائص العنصر المحدد</span>
        </div>
        <div>
          {!hasSelection && <span className="text-[11px] text-txt-muted px-2 py-0.5 rounded bg-editor-surface">لا شيء</span>}
          {selectedSpars.length === 1 && <span className="text-[11px] font-bold text-cat-spar px-2 py-0.5 rounded bg-cat-spar/15 border border-cat-spar/30">خشبة</span>}
          {selectedSpars.length > 1 && <span className="text-[11px] font-bold text-accent px-2 py-0.5 rounded bg-accent/15 border border-accent/30">{selectedSpars.length} أخشاب</span>}
          {selectedLashing && <span className="text-[11px] font-bold text-cat-lashing px-2 py-0.5 rounded bg-cat-lashing/15 border border-cat-lashing/30">ربطة</span>}
          {selectedStake && <span className="text-[11px] font-bold text-cat-stake px-2 py-0.5 rounded bg-cat-stake/15 border border-cat-stake/30">وتد</span>}
          {selectedGuyLine && <span className="text-[11px] font-bold text-cat-guyline px-2 py-0.5 rounded bg-cat-guyline/15 border border-cat-guyline/30">حبل شد</span>}
          {selectedGuidePoint && <span className="text-[11px] font-bold text-cat-guide px-2 py-0.5 rounded bg-cat-guide/15 border border-cat-guide/30">دليل</span>}
          {selectedGuideLine && <span className="text-[11px] font-bold text-cat-guide px-2 py-0.5 rounded bg-cat-guide/15 border border-cat-guide/30">خط دليل</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Empty state card */}
        {!hasSelection && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-editor-border rounded-2xl bg-editor-surface/30">
            <div className="w-12 h-12 rounded-2xl bg-editor-surface flex items-center justify-center text-2xl mb-3 shadow-inner text-txt-muted">
              🪵
            </div>
            <h4 className="text-xs font-bold text-txt-primary mb-1">لم يتم تحديد أي عنصر</h4>
            <p className="text-[11px] text-txt-muted leading-relaxed max-w-[200px]">
              انقر على أي خشبة أو وتد أو ربطة في المشهد ثلاثي الأبعاد لعرض والتحكم في خصائصها الهندسية.
            </p>
          </div>
        )}

        {/* ═══ Single Spar Selected ═══ */}
        {selectedSpars.length === 1 && (
          <>
            <Section title="الأبعاد والمواصفات" defaultOpen={true}>
              <PropRow label="النوع">
                <span className="text-xs text-cat-spar font-bold">{translateSparType(selectedSpars[0].type)}</span>
              </PropRow>

              {/* Length Slider */}
              <PropRow label="الطول">
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={selectedSpars[0].length}
                    onChange={(e) => updateSparDimensions(selectedSpars[0].id, parseFloat(e.target.value), selectedSpars[0].radius)}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1 w-16" dir="ltr">
                    <input
                      type="number"
                      min="0.5"
                      max="10"
                      step="0.1"
                      value={selectedSpars[0].length}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          updateSparDimensions(selectedSpars[0].id, val, selectedSpars[0].radius);
                        }
                      }}
                      className="dcc-num-input w-12 text-center"
                    />
                    <span className="text-[11px] text-txt-muted">م</span>
                  </div>
                </div>
              </PropRow>

              {/* Diameter Slider */}
              <PropRow label="القطر">
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="1"
                    value={selectedSpars[0].radius * 2 * 100}
                    onChange={(e) => updateSparDimensions(selectedSpars[0].id, selectedSpars[0].length, parseFloat(e.target.value) / 2 / 100)}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1 w-16" dir="ltr">
                    <input
                      type="number"
                      min="2"
                      max="30"
                      step="1"
                      value={Math.round(selectedSpars[0].radius * 2 * 100)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          updateSparDimensions(selectedSpars[0].id, selectedSpars[0].length, val / 2 / 100);
                        }
                      }}
                      className="dcc-num-input w-12 text-center"
                    />
                    <span className="text-[11px] text-txt-muted">سم</span>
                  </div>
                </div>
              </PropRow>

              <PropRow label="الربطات">
                <span className="text-xs font-bold text-cat-lashing">{lashingGraph.get(selectedSpars[0].id)?.size || 0} ربطة متصلة</span>
              </PropRow>
            </Section>

            {/* Position & Rotation with strict LTR and Interactive Editing */}
            <Section title="الموقع والدوران في الفضاء" defaultOpen={true}>
              <div className="flex items-center justify-between pb-1 text-xs">
                <span className="text-txt-muted text-[11px]">نظام محاور الجيزمو:</span>
                <button
                  onClick={toggleGizmoSpace}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                    gizmoSpace === 'local' ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-editor-input border-editor-border text-txt-secondary'
                  }`}
                >
                  {gizmoSpace === 'local' ? '📐 محلي (Local)' : '🌐 عالمي (World)'}
                </button>
              </div>

              <PropRow label="الموقع (XYZ)">
                <XYZDisplay
                  x={selectedSpars[0].position.x}
                  y={selectedSpars[0].position.y}
                  z={selectedSpars[0].position.z}
                  onChange={(axis, val) => {
                    const spar = selectedSpars[0];
                    const newPos = spar.position.clone();
                    newPos[axis] = val;
                    setSparPosition(spar.id, newPos);
                  }}
                />
              </PropRow>
              <PropRow label="الدوران (°)">
                {(() => {
                  const rot = new THREE.Euler().setFromQuaternion(selectedSpars[0].quaternion);
                  const degX = THREE.MathUtils.radToDeg(rot.x);
                  const degY = THREE.MathUtils.radToDeg(rot.y);
                  const degZ = THREE.MathUtils.radToDeg(rot.z);
                  return (
                    <XYZDisplay
                      x={degX}
                      y={degY}
                      z={degZ}
                      step={5}
                      onChange={(axis, val) => {
                        const spar = selectedSpars[0];
                        const curRot = new THREE.Euler().setFromQuaternion(spar.quaternion);
                        const newDeg = {
                          x: axis === 'x' ? val : THREE.MathUtils.radToDeg(curRot.x),
                          y: axis === 'y' ? val : THREE.MathUtils.radToDeg(curRot.y),
                          z: axis === 'z' ? val : THREE.MathUtils.radToDeg(curRot.z),
                        };
                        setSparRotationEuler(spar.id, newDeg);
                      }}
                    />
                  );
                })()}
              </PropRow>
            </Section>

            {/* Nudge Controls */}
            <Section title="الضبط والإزاحة الدقيقة" defaultOpen={false}>
              <div className="space-y-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-txt-secondary block">إزاحة الموضع بمقدار (0.1م):</span>
                  <div className="flex gap-1" dir="ltr">
                    <NudgeBtn label="X−" onClick={() => nudgeSelectedSpars('x', -0.1)} />
                    <NudgeBtn label="X+" onClick={() => nudgeSelectedSpars('x', 0.1)} />
                    <NudgeBtn label="Y−" onClick={() => nudgeSelectedSpars('y', -0.1)} />
                    <NudgeBtn label="Y+" onClick={() => nudgeSelectedSpars('y', 0.1)} />
                    <NudgeBtn label="Z−" onClick={() => nudgeSelectedSpars('z', -0.1)} />
                    <NudgeBtn label="Z+" onClick={() => nudgeSelectedSpars('z', 0.1)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-txt-secondary block">تدوير الزاوية بمقدار (15°):</span>
                  <div className="flex gap-1" dir="ltr">
                    <NudgeBtn label="−X" onClick={() => rotateSelectedSpars('x', -15)} />
                    <NudgeBtn label="+X" onClick={() => rotateSelectedSpars('x', 15)} />
                    <NudgeBtn label="−Y" onClick={() => rotateSelectedSpars('y', -15)} />
                    <NudgeBtn label="+Y" onClick={() => rotateSelectedSpars('y', 15)} />
                    <NudgeBtn label="−Z" onClick={() => rotateSelectedSpars('z', -15)} />
                    <NudgeBtn label="+Z" onClick={() => rotateSelectedSpars('z', 15)} />
                  </div>
                </div>
              </div>
            </Section>

            {/* Primary Actions */}
            <Section title="إجراءات الخشبة" defaultOpen={true}>
              <div className="space-y-2">
                <ActionBtn onClick={dropSparToGround} fullWidth variant="primary">
                  ↓ إنزال للسطح مباشرة [B]
                </ActionBtn>

                <div className="flex items-center justify-between px-2 py-1 bg-editor-input/50 rounded-lg border border-editor-border/40">
                  <label className="text-xs text-txt-secondary cursor-pointer select-none" htmlFor="drop-flat-single">
                    تسطيح الخشب أفقياً عند الإنزال
                  </label>
                  <input
                    id="drop-flat-single"
                    type="checkbox"
                    checked={dropFlatEnabled}
                    onChange={(e) => setDropFlatEnabled(e.target.checked)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <ActionBtn onClick={duplicateSelectedSpar}>
                    📋 تكرار [Shift+D]
                  </ActionBtn>
                  <ActionBtn onClick={alignSelectedSpar}>
                    📐 محاذاة 90°
                  </ActionBtn>
                </div>

                {selectedSpars[0].groupId && (
                  <ActionBtn onClick={ungroupSelectedSpars} fullWidth variant="danger">
                    🔓 فك التجميع [Ungroup]
                  </ActionBtn>
                )}

                {/* GuyLine Anchor Creation */}
                {guyLinePlacementActive && guyLineSourceSparId === selectedSpars[0].id ? (
                  <div className="space-y-1.5 bg-status-warning/10 p-2.5 rounded-xl border border-status-warning/40">
                    <div className="text-xs font-bold text-status-warning flex items-center gap-1.5">
                      <span>🧵</span> انقر على أي وتد أرضي لإتمام ربط حبل الشد
                    </div>
                    <ActionBtn onClick={cancelGuyLinePlacement} fullWidth variant="danger">
                      إلغاء وضع الحبل
                    </ActionBtn>
                  </div>
                ) : (
                  <button 
                    onClick={() => startGuyLinePlacement(selectedSpars[0].id)}
                    className="w-full dcc-btn text-xs font-bold py-2 bg-cat-stake/15 hover:bg-cat-stake/25 text-cat-stake border border-cat-stake/40 rounded-lg transition-all"
                  >
                    ⚓ شد وتثبيت أرضي بواسطة وتد
                  </button>
                )}
              </div>
            </Section>

            {/* Linear Array Generator */}
            <Section title="تكرار كمصفوفة خطية (Array)" defaultOpen={false}>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-txt-muted">عدد التكرارات:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={arrayCount}
                    onChange={(e) => setArrayCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="dcc-num-input w-20 text-center"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-txt-muted">مسافة التباعد:</span>
                  <div className="flex items-center gap-1" dir="ltr">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={arrayDistance}
                      onChange={(e) => setArrayDistance(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                      className="dcc-num-input w-20 text-center"
                    />
                    <span className="text-xs text-txt-muted">م</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-txt-muted">محور التكرار:</span>
                  <div className="flex gap-1" dir="ltr">
                    {(['x', 'y', 'z'] as const).map(ax => (
                      <button
                        key={ax}
                        onClick={() => setArrayAxis(ax)}
                        className={`px-3 py-1 border rounded-lg text-xs font-bold transition-all ${
                          arrayAxis === ax 
                            ? 'bg-accent border-accent text-white shadow-xs' 
                            : 'bg-editor-input border-editor-border text-txt-secondary hover:bg-editor-hover'
                        }`}
                      >
                        {ax.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => createLinearArray(selectedSpars[0].id, arrayCount, arrayDistance, arrayAxis)}
                  className="w-full dcc-btn text-xs font-bold py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-lg transition-all"
                >
                  ➕ توليد المصفوفة الخطية
                </button>
              </div>
            </Section>

            {/* Guide Points from Spar Ends */}
            <Section title="توليد نقاط دليل من الأطراف" defaultOpen={false}>
              <div className="grid grid-cols-2 gap-2">
                <ActionBtn onClick={() => {
                  const spar = selectedSpars[0];
                  const localY = new THREE.Vector3(0, 1, 0).applyQuaternion(spar.quaternion).normalize();
                  const halfLen = spar.length / 2;
                  const pos = spar.position.clone().addScaledVector(localY, -halfLen);
                  addGuidePointAtPosition(pos);
                }}>
                  دليل طرف البداية
                </ActionBtn>
                <ActionBtn onClick={() => {
                  const spar = selectedSpars[0];
                  const localY = new THREE.Vector3(0, 1, 0).applyQuaternion(spar.quaternion).normalize();
                  const halfLen = spar.length / 2;
                  const pos = spar.position.clone().addScaledVector(localY, halfLen);
                  addGuidePointAtPosition(pos);
                }}>
                  دليل طرف النهاية
                </ActionBtn>
              </div>
            </Section>

            {/* Snap Targets & Two-Point Alignment */}
            {(guidePoints.length > 0 || stakes.length > 0 || guideLines.length > 0) && (
              <Section title="محاذاة بنقاط الهدف والأطراف (Snap & Span)" defaultOpen={true}>
                {/* Two-Point Span Feature */}
                <div className="p-3 bg-editor-surface/80 rounded-xl border border-accent/30 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-editor-border/50 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🎯</span>
                      <span className="text-xs font-bold text-accent">محاذاة وامتداد بين نقطتين (Span)</span>
                    </div>
                    {targetDistance > 0 && (
                      <span className="text-[11px] font-mono font-semibold text-txt-secondary bg-editor-input px-2 py-0.5 rounded border border-editor-border">
                        {targetDistance.toFixed(2)} م
                      </span>
                    )}
                  </div>

                  {/* Start Point & End Point Selectors */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Start Point */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span>🏁</span> نقطة البداية (رأس)
                        </span>
                      </div>
                      <select
                        value={startTargetId}
                        onChange={(e) => {
                          setStartTargetId(e.target.value);
                          setCustomOffsetStart(null); // Reset to auto-detect
                        }}
                        className="w-full text-xs bg-editor-input text-txt-primary p-1.5 rounded-lg border border-editor-border focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">-- اختر نقطة البداية --</option>
                        {availableTargets.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      {/* Wood detection status at start */}
                      {selectedStartTarget && (
                        <div className="pt-0.5">
                          {woodAtStart.hasWood ? (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium leading-tight">
                              🪵 خشب ملاصق (+{Math.round(lashingEndOffset * 100)}سم)
                            </span>
                          ) : (
                            <span className="text-[10px] text-txt-muted bg-editor-input/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                              📍 نقطة حرة (0 سم)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* End Point */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-sky-400 font-bold flex items-center gap-1">
                          <span>🛑</span> نقطة النهاية (ذيل)
                        </span>
                      </div>
                      <select
                        value={endTargetId}
                        onChange={(e) => {
                          setEndTargetId(e.target.value);
                          setCustomOffsetEnd(null); // Reset to auto-detect
                        }}
                        className="w-full text-xs bg-editor-input text-txt-primary p-1.5 rounded-lg border border-editor-border focus:border-sky-500 focus:outline-none"
                      >
                        <option value="">-- اختر نقطة النهاية --</option>
                        {availableTargets.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      {/* Wood detection status at end */}
                      {selectedEndTarget && (
                        <div className="pt-0.5">
                          {woodAtEnd.hasWood ? (
                            <span className="text-[10px] text-sky-400 bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium leading-tight">
                              🪵 خشب ملاصق (+{Math.round(lashingEndOffset * 100)}سم)
                            </span>
                          ) : (
                            <span className="text-[10px] text-txt-muted bg-editor-input/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                              📍 نقطة حرة (0 سم)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lashing Clearances and Length Fit Toggles */}
                  {selectedStartTarget && selectedEndTarget && (
                    <div className="space-y-1.5 pt-1 text-[11px] border-t border-editor-border/40">
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-txt-secondary hover:text-txt-primary">
                          <input
                            type="checkbox"
                            checked={effectiveOffsetStart}
                            onChange={(e) => setCustomOffsetStart(e.target.checked)}
                            className="rounded text-emerald-500 focus:ring-0"
                          />
                          <span>خلوص رباط للبداية (+{Math.round(lashingEndOffset * 100)}سم)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-txt-secondary hover:text-txt-primary">
                          <input
                            type="checkbox"
                            checked={effectiveOffsetEnd}
                            onChange={(e) => setCustomOffsetEnd(e.target.checked)}
                            className="rounded text-sky-500 focus:ring-0"
                          />
                          <span>خلوص رباط للنهاية (+{Math.round(lashingEndOffset * 100)}سم)</span>
                        </label>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-txt-secondary hover:text-txt-primary">
                          <input
                            type="checkbox"
                            checked={fitLengthEnabled}
                            onChange={(e) => setFitLengthEnabled(e.target.checked)}
                            className="rounded text-accent focus:ring-0"
                          />
                          <span>مطابقة الطول تلقائياً</span>
                        </label>
                        <span className="text-xs font-bold text-accent font-mono">
                          {finalCalculatedLength.toFixed(2)} م
                        </span>
                      </div>

                      <label className="flex items-center gap-1.5 cursor-pointer select-none text-txt-secondary hover:text-txt-primary">
                        <input
                          type="checkbox"
                          checked={autoTieLashing}
                          onChange={(e) => setAutoTieLashing(e.target.checked)}
                          className="rounded text-cat-lashing focus:ring-0"
                        />
                        <span>ربط تلقائي بالعقد الكشفية عند التماس مع الخشب</span>
                      </label>
                    </div>
                  )}

                  {/* Main Action Button */}
                  <button
                    disabled={!selectedStartTarget || !selectedEndTarget || selectedStartTarget.id === selectedEndTarget.id}
                    onClick={handleExecuteSpan}
                    className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600/30 via-accent/30 to-sky-600/30 hover:from-emerald-600/40 hover:via-accent/40 hover:to-sky-600/40 text-white font-bold text-xs rounded-lg border border-accent/50 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    <span>🚀</span>
                    <span>محاذاة وامتداد الخشبة من البداية إلى النهاية</span>
                  </button>
                  {selectedStartTarget && selectedEndTarget && selectedStartTarget.id === selectedEndTarget.id && (
                    <div className="text-[11px] text-status-warning text-center">
                      ⚠️ يرجى اختيار نقطتين مختلفتين للبداية والنهاية
                    </div>
                  )}
                </div>

                {/* Individual targets list (with quick action buttons and badges) */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-txt-secondary block mb-1.5">
                    النقاط المتوفرة (انقر رأس/ذيل للتعيين السريع):
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
                    {guidePoints.map((pt, idx) => {
                      const targetId = `gp_${pt.id}`;
                      const isStart = startTargetId === targetId;
                      const isEnd = endTargetId === targetId;
                      return (
                        <div key={pt.id} className={`flex items-center justify-between text-xs p-1.5 rounded-lg border transition-all ${
                          isStart ? 'bg-emerald-500/15 border-emerald-500/50' : isEnd ? 'bg-sky-500/15 border-sky-500/50' : 'bg-editor-input border-editor-border'
                        }`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-txt-secondary truncate font-medium">{pt.name || `دليل مرجعي ${idx + 1}`}</span>
                            {isStart && <span className="text-[10px] bg-emerald-500/25 text-emerald-300 px-1 rounded font-bold">بداية 🏁</span>}
                            {isEnd && <span className="text-[10px] bg-sky-500/25 text-sky-300 px-1 rounded font-bold">نهاية 🛑</span>}
                          </div>
                          <div className="flex gap-1" dir="ltr">
                            <button
                              onClick={() => {
                                setStartTargetId(targetId);
                                setCustomOffsetStart(null);
                                snapSparPointToTarget(selectedSpars[0].id, 'start', pt.position);
                              }}
                              title="تعيين كنقطة بداية ومحاذاة الرأس"
                              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                isStart ? 'bg-emerald-600 text-white shadow' : 'bg-editor-hover text-cat-guide hover:text-white'
                              }`}
                            >
                              رأس
                            </button>
                            <button
                              onClick={() => {
                                setEndTargetId(targetId);
                                setCustomOffsetEnd(null);
                                snapSparPointToTarget(selectedSpars[0].id, 'end', pt.position);
                              }}
                              title="تعيين كنقطة نهاية ومحاذاة الذيل"
                              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                isEnd ? 'bg-sky-600 text-white shadow' : 'bg-editor-hover text-cat-guide hover:text-white'
                              }`}
                            >
                              ذيل
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {stakes.map((stk, idx) => {
                      const targetId = `stk_${stk.id}`;
                      const isStart = startTargetId === targetId;
                      const isEnd = endTargetId === targetId;
                      return (
                        <div key={stk.id} className={`flex items-center justify-between text-xs p-1.5 rounded-lg border transition-all ${
                          isStart ? 'bg-emerald-500/15 border-emerald-500/50' : isEnd ? 'bg-sky-500/15 border-sky-500/50' : 'bg-editor-input border-editor-border'
                        }`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-txt-secondary truncate font-medium">{stk.name || `وتد تثبيت ${idx + 1}`}</span>
                            {isStart && <span className="text-[10px] bg-emerald-500/25 text-emerald-300 px-1 rounded font-bold">بداية 🏁</span>}
                            {isEnd && <span className="text-[10px] bg-sky-500/25 text-sky-300 px-1 rounded font-bold">نهاية 🛑</span>}
                          </div>
                          <div className="flex gap-1" dir="ltr">
                            <button
                              onClick={() => {
                                setStartTargetId(targetId);
                                setCustomOffsetStart(null);
                                snapSparPointToTarget(selectedSpars[0].id, 'start', stk.position);
                              }}
                              title="تعيين كنقطة بداية ومحاذاة الرأس"
                              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                isStart ? 'bg-emerald-600 text-white shadow' : 'bg-editor-hover text-cat-stake hover:text-white'
                              }`}
                            >
                              رأس
                            </button>
                            <button
                              onClick={() => {
                                setEndTargetId(targetId);
                                setCustomOffsetEnd(null);
                                snapSparPointToTarget(selectedSpars[0].id, 'end', stk.position);
                              }}
                              title="تعيين كنقطة نهاية ومحاذاة الذيل"
                              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                isEnd ? 'bg-sky-600 text-white shadow' : 'bg-editor-hover text-cat-stake hover:text-white'
                              }`}
                            >
                              ذيل
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Section>
            )}
          </>
        )}

        {/* ═══ Multi-spar Selected ═══ */}
        {selectedSpars.length > 1 && (
          <>
            <Section title="تحديد متعدد" defaultOpen={true}>
              <PropRow label="العدد">
                <span className="text-xs font-bold text-accent">{selectedSpars.length} أخشاب محددة</span>
              </PropRow>
              <PropRow label="حالة التجميع">
                {selectedSpars.some(s => s.groupId) ? (
                  <span className="text-xs text-status-success font-bold">مجمعة (Grouped)</span>
                ) : (
                  <span className="text-xs text-txt-muted">أخشاب منفصلة</span>
                )}
              </PropRow>
            </Section>

            <Section title="إجراءات الدفعة" defaultOpen={true}>
              <div className="space-y-2">
                <button
                  onClick={groupSelectedSpars}
                  className="w-full dcc-btn text-xs font-bold py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-lg transition-all"
                >
                  🔗 تجميع الأخشاب في كتلة واحدة [Group]
                </button>

                {selectedSpars.some(s => s.groupId) && (
                  <ActionBtn onClick={ungroupSelectedSpars} fullWidth variant="danger">
                    🔓 فك التجميع [Ungroup]
                  </ActionBtn>
                )}

                <ActionBtn onClick={dropSparToGround} fullWidth variant="primary">
                  ↓ إنزال المجموعة للسطح [B]
                </ActionBtn>

                <div className="flex items-center justify-between px-2 py-1 bg-editor-input/50 rounded-lg border border-editor-border/40">
                  <label className="text-xs text-txt-secondary cursor-pointer select-none" htmlFor="drop-flat-multi">
                    تسطيح الخشب أفقياً عند الإنزال
                  </label>
                  <input
                    id="drop-flat-multi"
                    type="checkbox"
                    checked={dropFlatEnabled}
                    onChange={(e) => setDropFlatEnabled(e.target.checked)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <ActionBtn onClick={duplicateSelectedSpar}>تكرار [Shift+D]</ActionBtn>
                  <ActionBtn onClick={alignSelectedSpar}>محاذاة 90°</ActionBtn>
                </div>
              </div>
            </Section>

            {/* Direct Scouting Lashing Section */}
            <Section title="ربط الأخشاب المحددة (Lashing)" defaultOpen={true} color="#eab308">
              <div className="space-y-2">
                <button
                  onClick={() => tieSelectedSpars()}
                  className="w-full dcc-btn text-xs font-bold py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <span>🪢</span> ربط تلقائي ذكي حسب الزاوية
                </button>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={() => tieSelectedSpars('square')}
                    className="py-1.5 px-1 text-[11px] font-bold bg-editor-input border border-editor-border rounded-lg hover:border-cat-lashing hover:text-cat-lashing text-txt-primary transition-all text-center"
                  >
                    مربعة (Square)
                  </button>
                  <button
                    onClick={() => tieSelectedSpars('diagonal')}
                    className="py-1.5 px-1 text-[11px] font-bold bg-editor-input border border-editor-border rounded-lg hover:border-cat-lashing hover:text-cat-lashing text-txt-primary transition-all text-center"
                  >
                    قطرية (Diagonal)
                  </button>
                  <button
                    onClick={() => tieSelectedSpars('shear')}
                    className="py-1.5 px-1 text-[11px] font-bold bg-editor-input border border-editor-border rounded-lg hover:border-cat-lashing hover:text-cat-lashing text-txt-primary transition-all text-center"
                  >
                    قص (Shear)
                  </button>
                </div>
                {selectedSpars.length >= 3 && (
                  <button
                    onClick={() => tieSelectedSpars('tripod')}
                    className="w-full py-1.5 text-[11px] font-bold bg-editor-input border border-editor-border rounded-lg hover:border-cat-lashing hover:text-cat-lashing text-txt-primary transition-all text-center"
                  >
                    🪢 ربطة ثلاثية (Tripod Lashing)
                  </button>
                )}
              </div>
            </Section>
          </>
        )}

        {/* ═══ Lashing Selected ═══ */}
        {selectedLashing && (
          <Section title="خصائص ربطة الحبل" defaultOpen={true}>
            <PropRow label="نوع الربطة">
              <span className="text-xs text-cat-lashing font-bold">{translateLashingType(selectedLashing.type)}</span>
            </PropRow>
            <PropRow label="الزاوية">
              <span className="text-xs font-mono font-bold text-txt-primary" dir="ltr">{selectedLashing.angle.toFixed(1)}°</span>
            </PropRow>
            <PropRow label="موقع العقدة">
              <XYZDisplay x={selectedLashing.position.x} y={selectedLashing.position.y} z={selectedLashing.position.z} />
            </PropRow>
          </Section>
        )}

        {/* ═══ Stake Selected ═══ */}
        {selectedStake && (
          <Section title="خصائص وتد التثبيت" defaultOpen={true}>
            <PropRow label="الموقع (XYZ)">
              <XYZDisplay x={selectedStake.position.x} y={selectedStake.position.y} z={selectedStake.position.z} />
            </PropRow>
            <PropRow label="زاوية الغرس">
              <span className="text-xs font-bold text-txt-primary">45° مائلة في الأرض</span>
            </PropRow>
            <div className="pt-2">
              <ActionBtn onClick={() => deleteStake(selectedStake.id)} fullWidth variant="danger">
                🗑️ حذف الوتد
              </ActionBtn>
            </div>
          </Section>
        )}

        {/* ═══ GuyLine Selected ═══ */}
        {selectedGuyLine && (
          <Section title="خصائص حبل الشد" defaultOpen={true}>
            <PropRow label="نسبة الشد">
              <span className="text-xs font-bold font-mono text-status-warning" dir="ltr">
                {(selectedGuyLine.tension * 100).toFixed(0)}%
              </span>
            </PropRow>
            <div className="space-y-1 pt-1">
              <input
                type="range"
                min="0" max="1" step="0.05"
                value={selectedGuyLine.tension}
                onChange={(e) => setGuyLineTension(selectedGuyLine.id, parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="pt-2">
              <ActionBtn onClick={() => deleteGuyLine(selectedGuyLine.id)} fullWidth variant="danger">
                ✂️ قطع وحذف حبل الشد
              </ActionBtn>
            </div>
          </Section>
        )}

        {/* ═══ GuidePoint Selected ═══ */}
        {selectedGuidePoint && (
          <>
            <Section title="خصائص نقطة الدليل (Reference Point)" defaultOpen={true}>
              <PropRow label="الموقع (XYZ)">
                <XYZDisplay 
                  x={selectedGuidePoint.position.x} 
                  y={selectedGuidePoint.position.y} 
                  z={selectedGuidePoint.position.z} 
                  onChange={(axis, val) => {
                    const newPos = selectedGuidePoint.position.clone();
                    newPos[axis] = val;
                    updateGuidePointPosition(selectedGuidePoint.id, newPos);
                  }}
                />
              </PropRow>
              <div className="pt-2 flex flex-col gap-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      updateGuidePointPosition(selectedGuidePoint.id, new THREE.Vector3(0, 0, 0));
                      Sounds.playSnap();
                    }}
                    className="py-1 px-2 text-[11px] font-bold rounded-lg bg-editor-surface hover:bg-editor-hover border border-editor-border text-txt-primary flex items-center justify-center gap-1"
                    title="نقل النقطة إلى زاوية البداية (0, 0, 0)"
                  >
                    📍 زاوية (0,0,0)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = selectedGuidePoint.position;
                      addGuideLine(cur.clone(), new THREE.Vector3(cur.x + 2, cur.y, cur.z));
                      Sounds.playSnap();
                    }}
                    className="py-1 px-2 text-[11px] font-bold rounded-lg bg-cat-guide/15 hover:bg-cat-guide/25 border border-cat-guide/40 text-cat-guide flex items-center justify-center gap-1"
                    title="إنشاء خط قياس من هذه النقطة"
                  >
                    📏 خط قياس +2م
                  </button>
                </div>
                <div className="bg-editor-surface/40 p-2 rounded-lg border border-editor-border/50 text-[10px] text-txt-muted leading-relaxed">
                  💡 <strong>طريقة القياس:</strong> أدخل إحداثيات (X, Y, Z) هنا لتثبيت النقطة بدقة، أو اسحبها بالماوس بمحاذاة الشبكة.
                </div>
              </div>
            </Section>
            <div className="pt-1">
              <ActionBtn onClick={() => deleteGuidePoint(selectedGuidePoint.id)} fullWidth variant="danger">
                🗑️ حذف نقطة الدليل
              </ActionBtn>
            </div>
          </>
        )}

        {/* ═══ GuideLine Selected ═══ */}
        {selectedGuideLine && (
          <>
            <Section title="خصائص خط الدليل والقياس (Ruler / Tape)" defaultOpen={true}>
              <PropRow label="النقطة الأولى A">
                <XYZDisplay 
                  x={selectedGuideLine.pointA.x} 
                  y={selectedGuideLine.pointA.y} 
                  z={selectedGuideLine.pointA.z} 
                  onChange={(axis, val) => {
                    const newPos = selectedGuideLine.pointA.clone();
                    newPos[axis] = val;
                    updateGuideLinePointPosition(selectedGuideLine.id, 'A', newPos);
                  }}
                />
              </PropRow>
              <PropRow label="النقطة الثانية B">
                <XYZDisplay 
                  x={selectedGuideLine.pointB.x} 
                  y={selectedGuideLine.pointB.y} 
                  z={selectedGuideLine.pointB.z} 
                  onChange={(axis, val) => {
                    const newPos = selectedGuideLine.pointB.clone();
                    newPos[axis] = val;
                    updateGuideLinePointPosition(selectedGuideLine.id, 'B', newPos);
                  }}
                />
              </PropRow>
              <PropRow label="طول المسار">
                <span className="text-sm font-mono font-bold text-accent" dir="ltr">
                  {selectedGuideLine.pointA.distanceTo(selectedGuideLine.pointB).toFixed(2)} متر
                </span>
              </PropRow>

              {/* Quick Distance Presets */}
              <div className="pt-2 space-y-1.5">
                <span className="text-[10px] text-txt-muted font-medium block">
                  تحديد مسافة سريعة من النقطة A على محور X:
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 5].map(dist => (
                    <button
                      key={`x-${dist}`}
                      type="button"
                      onClick={() => {
                        const pA = selectedGuideLine.pointA;
                        const newB = new THREE.Vector3(pA.x + dist, pA.y, pA.z);
                        updateGuideLinePointPosition(selectedGuideLine.id, 'B', newB);
                        Sounds.playClick();
                      }}
                      className="py-1 px-1 rounded-md text-[11px] font-mono font-bold bg-editor-surface hover:bg-editor-hover border border-editor-border text-txt-primary"
                    >
                      {dist}م X
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-txt-muted font-medium block pt-1">
                  تحديد مسافة سريعة من النقطة A على محور Z:
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 5].map(dist => (
                    <button
                      key={`z-${dist}`}
                      type="button"
                      onClick={() => {
                        const pA = selectedGuideLine.pointA;
                        const newB = new THREE.Vector3(pA.x, pA.y, pA.z + dist);
                        updateGuideLinePointPosition(selectedGuideLine.id, 'B', newB);
                        Sounds.playClick();
                      }}
                      className="py-1 px-1 rounded-md text-[11px] font-mono font-bold bg-editor-surface hover:bg-editor-hover border border-editor-border text-txt-primary"
                    >
                      {dist}م Z
                    </button>
                  ))}
                </div>
              </div>
            </Section>
            <div className="pt-1">
              <ActionBtn onClick={() => deleteGuideLine(selectedGuideLine.id)} fullWidth variant="danger">
                🗑️ حذف خط القياس
              </ActionBtn>
            </div>
          </>
        )}

        {/* ═══ Snap Alignment Process ═══ */}
        {selectedSourceSparPoint && (
          <Section title="محاذاة ونقل الخشبة" defaultOpen={true} color="#f59e0b">
            <PropRow label="المصدر">
              <span className="text-xs font-bold text-txt-primary">
                {selectedSourceSparPoint.pointKey === 'start' ? 'طرف البداية' : 'طرف النهاية'}
              </span>
            </PropRow>
            <PropRow label="نقطة الهدف">
              {selectedTargetPoint ? (
                <span className="text-xs font-bold text-status-success">{selectedTargetPoint.label}</span>
              ) : (
                <span className="text-xs text-status-warning animate-pulse">انقر على وتد أو دليل بالماوس...</span>
              )}
            </PropRow>
            <div className="flex gap-2 pt-2">
              {selectedTargetPoint && (
                <ActionBtn onClick={moveSparToTarget} fullWidth variant="primary">
                  تنفيذ النقل [M]
                </ActionBtn>
              )}
              <ActionBtn onClick={() => { selectSourceSparPoint(null); selectTargetPoint(null); }}>
                إلغاء
              </ActionBtn>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default InfoPanel;
