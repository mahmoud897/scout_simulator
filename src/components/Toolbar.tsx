import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Sounds, type SoundProfile } from '../utils/sound';
import { CampReportModal } from './CampReportModal';
import { ShareModal } from './ShareModal';
import { captureAllAngles, extractCampReportData } from '../utils/reportGenerator';
import type { CampSnapshot, CampReportData } from '../utils/reportGenerator';
import { scoutingTemplates } from '../utils/templateBuilders';

interface ToolbarProps {
  onShowHelp: () => void;
  onShowTemplates: () => void;
}

// Crisp modern SVG icons
const MoveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M2 12h20M12 2l-3 3m3-3l3 3M12 22l-3-3m3 3l3-3M2 12l3-3m-3 3l3 3M22 12l-3-3m3 3l-3 3" />
  </svg>
);

const RotateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

const BoxSelectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const LassoSelectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9S17 3 12 3z" strokeDasharray="4 2" />
    <circle cx="12" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

const LockIcon = ({ locked }: { locked: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {locked ? (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ) : (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </>
    )}
  </svg>
);

const MultiSelectIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="13" height="13" rx="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const GroundIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20h18M5 16l7-12 7 12" />
    <path d="M9 16h6" />
  </svg>
);

const SmartSnapIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3v6a6 6 0 0 0 12 0V3" />
    <line x1="4" y1="3" x2="8" y2="3" />
    <line x1="16" y1="3" x2="20" y2="3" />
    <line x1="4" y1="7" x2="8" y2="7" />
    <line x1="16" y1="7" x2="20" y2="7" />
  </svg>
);

const UndoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10h10a5 5 0 0 1 5 5v2M3 10l5-5M3 10l5 5" />
  </svg>
);

const RedoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10H11a5 5 0 0 0-5 5v2M21 10l-5-5M21 10l-5 5" />
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
  </svg>
);

const DuplicateIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const AlignIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="21" y1="3" x2="3" y2="3" />
    <line x1="21" y1="21" x2="3" y2="21" />
    <rect x="7" y="7" width="10" height="10" rx="1" />
  </svg>
);

const SoundIcon = ({ on }: { on: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {on ? (
      <>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
      </>
    ) : (
      <>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </>
    )}
  </svg>
);

const BlueprintIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);

const TemplateIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5z" />
    <rect x="4" y="11" width="7" height="9" rx="1" />
    <rect x="13" y="11" width="7" height="9" rx="1" />
  </svg>
);

const HelpIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
  </svg>
);

const SpaceLocalIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const SnapHandlesIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="12" r="3" />
    <line x1="9" y1="12" x2="15" y2="12" strokeDasharray="2 2" />
  </svg>
);

export const Toolbar: React.FC<ToolbarProps> = ({ onShowHelp, onShowTemplates }) => {
  const transformMode = useStore(state => state.transformMode);
  const setTransformMode = useStore(state => state.setTransformMode);
  
  const activeTool = useStore(state => state.activeTool);
  const setActiveTool = useStore(state => state.setActiveTool);
  
  const lashingLocked = useStore(state => state.lashingLocked);
  const toggleLashingLock = useStore(state => state.toggleLashingLock);
  
  const multiSelectActive = useStore(state => state.multiSelectActive);
  const toggleMultiSelect = useStore(state => state.toggleMultiSelect);

  const groundConstraintEnabled = useStore(state => state.groundConstraintEnabled);
  const toggleGroundConstraint = useStore(state => state.toggleGroundConstraint);
  const pivotMode = useStore(state => state.pivotMode);
  const togglePivotMode = useStore(state => state.togglePivotMode);
  
  const soundEnabled = useStore(state => state.soundEnabled);
  const toggleSound = useStore(state => state.toggleSound);
  const soundVolume = useStore(state => state.soundVolume);
  const setSoundVolume = useStore(state => state.setSoundVolume);
  const soundProfile = useStore(state => state.soundProfile);
  const customTemplates = useStore(state => state.customTemplates || []);
  const setSoundProfile = useStore(state => state.setSoundProfile);
  
  const blueprintMode = useStore(state => state.blueprintMode);
  const toggleBlueprintMode = useStore(state => state.toggleBlueprintMode);

  const selectedSpars = useStore(state => state.selectedSpars);
  const duplicateSelectedSpar = useStore(state => state.duplicateSelectedSpar);
  const alignSelectedSpar = useStore(state => state.alignSelectedSpar);
  const gizmoSpace = useStore(state => state.gizmoSpace);
  const toggleGizmoSpace = useStore(state => state.toggleGizmoSpace);
  const snapHandlesVisible = useStore(state => state.snapHandlesVisible);
  const toggleSnapHandles = useStore(state => state.toggleSnapHandles);
  const smartSnappingEnabled = useStore(state => state.smartSnappingEnabled);
  const toggleSmartSnapping = useStore(state => state.toggleSmartSnapping);
  const lashingEndOffset = useStore(state => state.lashingEndOffset);
  const setLashingEndOffset = useStore(state => state.setLashingEndOffset);
  const tieSelectedSpars = useStore(state => state.tieSelectedSpars);

  const undo = useStore(state => state.undo);
  const redo = useStore(state => state.redo);
  const actionHistory = useStore(state => state.actionHistory);
  const actionRedoHistory = useStore(state => state.actionRedoHistory);
  const historyToastMessage = useStore(state => state.historyToastMessage);
  const setHistoryToastMessage = useStore(state => state.setHistoryToastMessage);
  const deleteSelected = useStore(state => state.deleteSelected);
  const clearScene = useStore(state => state.clearScene);
  const selectAll = useStore(state => state.selectAll);

  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('تمت العملية بنجاح');

  useEffect(() => {
    if (historyToastMessage) {
      setToastMessage(historyToastMessage);
      setSaveToast(true);
      const timer = setTimeout(() => setSaveToast(false), 2000);
      setHistoryToastMessage(null);
      return () => clearTimeout(timer);
    }
  }, [historyToastMessage, setHistoryToastMessage]);

  // Camp Land Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [capturingReport, setCapturingReport] = useState(false);
  const [reportSnapshots, setReportSnapshots] = useState<CampSnapshot[]>([]);
  const [reportData, setReportData] = useState<CampReportData | null>(null);

  // Share & Online Viewer QR Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleOpenReport = async () => {
    try {
      Sounds.playClick();
      setCapturingReport(true);
      const snapshots = await captureAllAngles();
      const data = extractCampReportData();
      setReportSnapshots(snapshots);
      setReportData(data);
      setReportModalOpen(true);
    } catch (err: unknown) {
      console.error('Failed to generate report:', err);
      const message = err instanceof Error ? err.message : 'يرجى التأكد من تحميل المشهد';
      alert('تعذر التقاط لقطات الكاميرا حالياً: ' + message);
    } finally {
      setCapturingReport(false);
    }
  };

  const spars = useStore(state => state.spars);
  const lashings = useStore(state => state.lashings);
  const stakes = useStore(state => state.stakes);
  const guyLinesAll = useStore(state => state.guyLines);
  
  const exportToJSON = useStore(state => state.exportToJSON);
  const importFromJSON = useStore(state => state.importFromJSON);
  const saveBlueprintLocal = useStore(state => state.saveBlueprintLocal);
  const loadBlueprintLocal = useStore(state => state.loadBlueprintLocal);
  const deleteBlueprintLocal = useStore(state => state.deleteBlueprintLocal);
  const getLocalBlueprintNames = useStore(state => state.getLocalBlueprintNames);

  const [savesExpanded, setSavesExpanded] = useState(false);

  const triggerToast = (msg = 'تمت العملية بنجاح') => {
    setToastMessage(msg);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2400);
  };

  const handleCopyBOM = () => {
    let text = `📋 قائمة المواد الهندسية - محاكي البناء الكشفي:\n\n`;
    const woodCounts: Record<string, number> = {};
    spars.forEach(s => { woodCounts[s.type] = (woodCounts[s.type] || 0) + 1; });
    text += `🪵 الأخشاب:\n`;
    if (woodCounts.stave) text += `- عصا قصيرة (1م): ${woodCounts.stave}\n`;
    if (woodCounts.medium) text += `- خشب متوسط (3م): ${woodCounts.medium}\n`;
    if (woodCounts.long) text += `- خشب طويل (4م): ${woodCounts.long}\n`;
    if (woodCounts.xlong) text += `- خشب طويل جداً (5م): ${woodCounts.xlong}\n`;
    text += `\n🪢 الربطات الكشفية:\n`;
    const lashCounts: Record<string, number> = {};
    lashings.forEach(l => { lashCounts[l.type] = (lashCounts[l.type] || 0) + 1; });
    if (lashCounts.square) text += `- ربطة مربعة: ${lashCounts.square}\n`;
    if (lashCounts.diagonal) text += `- ربطة قطرية: ${lashCounts.diagonal}\n`;
    if (lashCounts.shear) text += `- ربطة قص: ${lashCounts.shear}\n`;
    if (stakes.length > 0) text += `\n📍 الأوتاد: ${stakes.length}\n`;
    if (guyLinesAll.length > 0) text += `🧵 حبال الشد: ${guyLinesAll.length}\n`;
    navigator.clipboard.writeText(text);
    triggerToast();
    setFileMenuOpen(false);
  };

  const handleExportFile = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pioneering_blueprint_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFileMenuOpen(false);
    triggerToast('تم تصدير ملف المخطط بنجاح');
  };

  const handleImportFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const success = importFromJSON(result);
          if (success) {
            triggerToast('تم استيراد المخطط وضبطه بنجاح');
          } else {
            alert('فشل استيراد الملف. تأكد من صحة تنسيق JSON.');
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
    setFileMenuOpen(false);
  };

  const handleQuickSave = () => {
    const name = prompt('اسم المخطط الهندسي:');
    if (name?.trim()) {
      saveBlueprintLocal(name.trim());
      triggerToast(`تم حفظ المخطط "${name.trim()}" بنجاح`);
    }
    setFileMenuOpen(false);
  };

  const kbd = (k: string) => (
    <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-editor-surface/80 text-txt-muted border border-editor-border rounded shadow-xs">{k}</kbd>
  );

  return (
    <>
      <header className="dcc-header flex items-center justify-between h-12 px-3 select-none z-40 relative shadow-sm border-b border-editor-border">
        
        {/* Right Section in RTL: Brand & File & Templates */}
        <div className="flex items-center gap-2">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 pl-3 border-l border-editor-divider">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-wood-700 flex items-center justify-center text-base shadow-glow-accent">
              ⛺
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-txt-primary tracking-wide">محاكي البناء</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-forest-500/20 text-forest-500 border border-forest-500/30">2.0</span>
              </div>
              <span className="text-[10px] text-txt-muted hidden sm:inline -mt-0.5">الريادة الكشفية ثلاثية الأبعاد</span>
            </div>
          </div>

          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => { setFileMenuOpen(!fileMenuOpen); Sounds.playClick(); }}
              className={`dcc-btn text-xs font-semibold gap-1.5 py-1.5 px-3 rounded-lg ${fileMenuOpen ? 'bg-editor-hover text-accent' : ''}`}
            >
              <FileIcon />
              <span>ملف</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${fileMenuOpen ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {fileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFileMenuOpen(false)} />
                <div className="absolute top-full right-0 mt-1.5 dcc-panel rounded-xl shadow-card-elevated z-50 min-w-[220px] py-1.5 border border-editor-border/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-txt-muted border-b border-editor-divider">إدارة المشروع</div>
                  
                  <button onClick={handleQuickSave} className="w-full text-right px-3 py-2 text-xs hover:bg-editor-hover text-txt-primary flex items-center justify-between gap-2 transition-colors">
                    <span className="flex items-center gap-2">💾 حفظ محلي</span>
                    {kbd('Ctrl+S')}
                  </button>
                  <button onClick={handleExportFile} className="w-full text-right px-3 py-2 text-xs hover:bg-editor-hover text-txt-primary flex items-center justify-between gap-2 transition-colors">
                    <span className="flex items-center gap-2">📤 تصدير ملف JSON</span>
                  </button>
                  <button onClick={handleImportFile} className="w-full text-right px-3 py-2 text-xs hover:bg-editor-hover text-txt-primary flex items-center justify-between gap-2 transition-colors">
                    <span className="flex items-center gap-2">📥 استيراد ملف</span>
                  </button>

                  {/* Comprehensive Land PDF Report */}
                  <button 
                    onClick={() => { setFileMenuOpen(false); handleOpenReport(); }} 
                    className="w-full text-right px-3 py-2 text-xs hover:bg-forest-600/15 text-emerald-300 font-bold flex items-center justify-between gap-2 transition-colors border-t border-editor-divider/60"
                  >
                    <span className="flex items-center gap-2">📑 إصدار تقرير الأرض الكامل (PDF)...</span>
                    <span className="text-[10px] bg-emerald-600/30 text-emerald-300 px-1.5 py-0.5 rounded font-mono">A4</span>
                  </button>

                  {/* Share & Online Viewer Link */}
                  <button 
                    onClick={() => { setFileMenuOpen(false); setShareModalOpen(true); }} 
                    className="w-full text-right px-3 py-2 text-xs hover:bg-sky-600/15 text-sky-300 font-bold flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="flex items-center gap-2">📱 مشاركة برابط و QR...</span>
                    <span className="text-[10px] bg-sky-600/30 text-sky-300 px-1.5 py-0.5 rounded font-mono">3D</span>
                  </button>

                  <div className="h-px bg-editor-divider my-1 mx-2" />

                  {spars.length > 0 && (
                    <button onClick={handleCopyBOM} className="w-full text-right px-3 py-2 text-xs hover:bg-editor-hover text-txt-primary flex items-center justify-between gap-2 transition-colors">
                      <span className="flex items-center gap-2">📋 نسخ قائمة المواد (BOM)</span>
                    </button>
                  )}

                  {/* Saved Blueprints Accordion */}
                  <button 
                    onClick={() => setSavesExpanded(!savesExpanded)} 
                    className="w-full text-right px-3 py-2 text-xs hover:bg-editor-hover text-txt-primary flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="flex items-center gap-2">🗂️ المخططات المحفوظة</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${savesExpanded ? 'rotate-180' : ''}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {savesExpanded && (
                    <div className="mx-2 my-1 bg-editor-input/90 rounded-lg border border-editor-border/60 max-h-36 overflow-y-auto p-1">
                      {getLocalBlueprintNames().length === 0 ? (
                        <div className="px-3 py-2 text-[11px] text-txt-muted text-center">لا توجد مخططات محفوظة بعد</div>
                      ) : (
                        getLocalBlueprintNames().map(name => (
                          <div key={name} className="flex items-center justify-between px-2 py-1.5 hover:bg-editor-hover rounded-md text-xs">
                            <button 
                              onClick={() => { loadBlueprintLocal(name); setFileMenuOpen(false); triggerToast(`تم استرجاع المخطط "${name}" بنجاح`); }}
                              className="text-txt-primary hover:text-accent truncate flex-1 text-right font-medium"
                            >
                              {name}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteBlueprintLocal(name); }}
                              className="text-status-error/80 hover:text-status-error text-xs mr-1 p-1 hover:bg-status-error/10 rounded"
                              title="حذف المخطط"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <div className="h-px bg-editor-divider my-1 mx-2" />

                  {/* Safe clear scene button */}
                  <button 
                    onClick={() => { setConfirmClearOpen(true); setFileMenuOpen(false); }} 
                    className="w-full text-right px-3 py-2 text-xs hover:bg-status-error/10 text-status-error flex items-center justify-between gap-2 transition-colors font-semibold"
                  >
                    <span className="flex items-center gap-2">🗑️ مسح المشهد بالكامل...</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Templates CTA Button with badge */}
          <button
            onClick={() => { Sounds.playClick(); onShowTemplates(); }}
            className="dcc-btn text-xs font-bold gap-2 px-3 py-1.5 bg-gradient-to-r from-accent/15 to-accent/5 hover:from-accent/25 hover:to-accent/10 text-accent border border-accent/30 rounded-lg shadow-xs transition-all hover:border-accent/60"
          >
            <TemplateIcon />
            <span>القوالب الهندسية</span>
            <span className="text-[10px] bg-accent text-white px-1.5 py-0.2 rounded-full font-bold">
              {scoutingTemplates.length + customTemplates.length}
            </span>
          </button>

          {/* Land Report PDF Action Button */}
          <button
            onClick={handleOpenReport}
            disabled={capturingReport}
            className="dcc-btn text-xs font-bold gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-600/25 to-emerald-500/10 hover:from-emerald-600/35 hover:to-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg shadow-glow-emerald transition-all hover:border-emerald-400 cursor-pointer disabled:opacity-50"
            title="إصدار تقرير شامل عن تصميم الأرض بصيغة PDF مع 4 لقطات معمارية وحصر دقيق"
          >
            {capturingReport ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>جارٍ الالتقاط...</span>
              </>
            ) : (
              <>
                <span className="text-sm">📑</span>
                <span>تقرير الأرض (PDF)</span>
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold">PDF</span>
              </>
            )}
          </button>

          {/* Share & QR Online Viewer Button */}
          <button
            onClick={() => { Sounds.playClick(); setShareModalOpen(true); }}
            className="dcc-btn text-xs font-bold gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600/25 to-blue-500/10 hover:from-sky-600/35 hover:to-blue-500/20 text-sky-300 border border-sky-500/40 rounded-lg shadow-glow-sky transition-all hover:border-sky-400 cursor-pointer"
            title="مشاركة التصميم برابط مباشر ورمز QR للمعاينة ثلاثية الأبعاد على أي هاتف"
          >
            <span className="text-sm">🌐</span>
            <span>مشاركة و QR</span>
            <span className="text-[10px] bg-sky-500 text-slate-950 px-1.5 py-0.2 rounded-full font-black">3D</span>
          </button>
        </div>

        {/* Center: Transform & Selection Tools (Floating Dock Style) */}
        <div className="flex items-center gap-1 bg-editor-surface/80 p-1 rounded-xl border border-editor-border/70 shadow-xs">
          
          {/* Translate / Rotate Mode & Coordinate Space */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => { Sounds.playClick(); setTransformMode('translate'); }}
              className={`tool-shelf-btn dcc-tooltip dcc-tooltip-bottom ${transformMode === 'translate' && !activeTool ? 'active' : ''}`}
              data-tip="أداة التحريك (W)"
              aria-label="تحريك"
            >
              <MoveIcon />
            </button>
            <button
              onClick={() => { Sounds.playClick(); setTransformMode('rotate'); }}
              className={`tool-shelf-btn dcc-tooltip dcc-tooltip-bottom ${transformMode === 'rotate' && !activeTool ? 'active' : ''}`}
              data-tip="أداة التدوير (E)"
              aria-label="تدوير"
            >
              <RotateIcon />
            </button>
            <button
              onClick={() => { Sounds.playClick(); toggleGizmoSpace(); }}
              className={`tool-shelf-btn dcc-tooltip dcc-tooltip-bottom ${gizmoSpace === 'local' ? 'text-accent bg-accent/15 border-accent/40 font-bold' : 'text-txt-muted'}`}
              data-tip={gizmoSpace === 'local' ? "محاور محلية للخشبة (X) - اضغط للتحويل لعالمي" : "محاور عالمية للمشهد (X) - اضغط للتحويل لمحلي"}
              aria-label="نظام المحاور"
            >
              <SpaceLocalIcon />
            </button>
            <button
              onClick={() => { Sounds.playClick(); toggleSnapHandles(); }}
              className={`tool-shelf-btn dcc-tooltip dcc-tooltip-bottom ${snapHandlesVisible ? 'text-sky-400 bg-sky-400/15 border-sky-400/30' : 'text-txt-muted opacity-50'}`}
              data-tip={snapHandlesVisible ? "نقاط الأطراف: مفعلة" : "نقاط الأطراف: مخفية"}
              aria-label="نقاط التقاط الأطراف"
            >
              <SnapHandlesIcon />
            </button>

            {/* Smart Scouting Snapping Tool Button with Lashing Margin Quick Selector */}
            <div className="relative flex items-center">
              <button
                onClick={() => { Sounds.playClick(); toggleSmartSnapping(); }}
                className={`tool-shelf-btn dcc-tooltip dcc-tooltip-bottom ${smartSnappingEnabled ? 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30 font-bold' : 'text-txt-muted opacity-50'}`}
                data-tip={smartSnappingEnabled ? `🧲 الانجذاب الكشفي الذكي: مفعل [S] (خلوص ${Math.round(lashingEndOffset * 100)} سم) - اضغط Alt للتجاوز الحر` : "🧲 الانجذاب الكشفي الذكي: معطل [S]"}
                aria-label="الانجذاب الكشفي الذكي"
              >
                <SmartSnapIcon />
              </button>

              {/* Quick cycle button for margin: 5cm -> 7cm -> 10cm */}
              {smartSnappingEnabled && (
                <button
                  onClick={() => {
                    Sounds.playClick();
                    const nextOffset = lashingEndOffset === 0.07 ? 0.10 : lashingEndOffset === 0.10 ? 0.05 : 0.07;
                    setLashingEndOffset(nextOffset);
                  }}
                  className="px-1.5 py-0.5 ml-1 text-[10px] font-bold font-mono rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 dcc-tooltip dcc-tooltip-bottom"
                  data-tip="تبديل خلوص أمان الربطة الكشفية (5 سم / 7 سم / 10 سم)"
                >
                  {Math.round(lashingEndOffset * 100)}سم
                </button>
              )}
            </div>
          </div>

          <div className="dcc-divider-v my-1" />

          {/* Selection Modes */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => { Sounds.playClick(); setActiveTool('select_box'); }}
              className={`tool-shelf-btn dcc-tooltip dcc-tooltip-bottom ${activeTool === 'select_box' ? 'active' : ''}`}
              data-tip="تحديد مربع (Q)"
              aria-label="تحديد مربع"
            >
              <BoxSelectIcon />
            </button>
            <button
              onClick={() => { Sounds.playClick(); setActiveTool('select_lasso'); }}
              className={`tool-shelf-btn dcc-tooltip dcc-tooltip-bottom ${activeTool === 'select_lasso' ? 'active' : ''}`}
              data-tip="تحديد حر (F)"
              aria-label="تحديد حر"
            >
              <LassoSelectIcon />
            </button>
            <button
              onClick={() => { Sounds.playClick(); toggleMultiSelect(); }}
              className={`tool-shelf-btn dcc-tooltip dcc-tooltip-bottom ${multiSelectActive ? 'active' : ''}`}
              data-tip="تحديد متعدد (Shift)"
              aria-label="تحديد متعدد"
            >
              <MultiSelectIcon />
            </button>
          </div>

          <div className="dcc-divider-v my-1" />

          {/* Assembly Constraints */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => { Sounds.playClick(); toggleLashingLock(); }}
              className={`tool-shelf-btn dcc-tooltip dcc-tooltip-bottom ${lashingLocked ? 'text-status-success bg-status-success/10 border-status-success/30' : 'text-status-warning bg-status-warning/10 border-status-warning/30'}`}
              data-tip={lashingLocked ? 'الربط الصلب: مفعل (الخشب المربوط يتحرك ككتلة واحدة)' : 'الربط الصلب: معطل (تعديل منفرد لكل خشبة)'}
            >
              <LockIcon locked={lashingLocked} />
            </button>
            <button
              onClick={() => { Sounds.playClick(); toggleGroundConstraint(); }}
              className={`tool-shelf-btn dcc-tooltip dcc-tooltip-bottom ${groundConstraintEnabled ? 'text-status-success bg-status-success/10 border-status-success/30' : ''}`}
              data-tip={groundConstraintEnabled ? 'قفل السطح: مفعل (يمنع اختراق الأرض)' : 'قفل السطح: معطل'}
            >
              <GroundIcon />
            </button>
            <button
              onClick={() => { Sounds.playClick(); togglePivotMode(); }}
              className={`tool-shelf-btn dcc-tooltip dcc-tooltip-bottom ${pivotMode === 'base' ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' : 'text-txt-muted'}`}
              data-tip={pivotMode === 'base' ? 'نقطة الارتكاز: أرضية واقعية (قاعدة الهيكل على الأرض)' : 'نقطة الارتكاز: هندسية (مركز العصا)'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <line x1="12" y1="1" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="1" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="23" y2="12" />
              </svg>
            </button>
          </div>

          {/* Quick actions if items are selected */}
          {selectedSpars.length > 0 && (
            <>
              <div className="dcc-divider-v my-1" />
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => { Sounds.playClick(); duplicateSelectedSpar(); }}
                  className="tool-shelf-btn dcc-tooltip dcc-tooltip-bottom text-cat-spar hover:bg-cat-spar/10"
                  data-tip="تكرار الخشب المحدد (Shift+D / D)"
                >
                  <DuplicateIcon />
                </button>
                <button
                  onClick={() => { Sounds.playClick(); alignSelectedSpar(); }}
                  className="tool-shelf-btn dcc-tooltip dcc-tooltip-bottom text-accent hover:bg-accent/10"
                  data-tip="محاذاة الزوايا (90° Snap)"
                >
                  <AlignIcon />
                </button>
                {selectedSpars.length >= 2 && (
                  <button
                    onClick={() => { Sounds.playLash(); tieSelectedSpars(); }}
                    className="tool-shelf-btn dcc-tooltip dcc-tooltip-bottom text-cat-lashing hover:bg-cat-lashing/20 border border-cat-lashing/40 font-bold px-1.5"
                    data-tip="🪢 ربط الأخشاب المحددة تلقائياً"
                  >
                    <span className="text-xs">🪢 ربط</span>
                  </button>
                )}
              </div>
            </>
          )}

          <div className="dcc-divider-v my-1" />

          {/* History Undo / Redo / Delete */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => { Sounds.playClick(); selectAll(); }}
              className="tool-shelf-btn dcc-tooltip dcc-tooltip-bottom"
              data-tip="تحديد الكل (Ctrl+A)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </button>
            {(() => {
              const canUndo = actionHistory.length > 0;
              const canRedo = actionRedoHistory.length > 0;
              const lastUndoAction = canUndo ? actionHistory[actionHistory.length - 1]?.label : null;
              const lastRedoAction = canRedo ? actionRedoHistory[actionRedoHistory.length - 1]?.label : null;
              const undoTip = canUndo ? `تراجع عن: ${lastUndoAction} (Ctrl+Z)` : 'تراجع (Ctrl+Z) - لا يوجد إجراءات';
              const redoTip = canRedo ? `إعادة: ${lastRedoAction} (Ctrl+Y)` : 'إعادة (Ctrl+Y) - لا يوجد إجراءات';

              return (
                <>
                  <button
                    onClick={() => undo()}
                    disabled={!canUndo}
                    className={`tool-shelf-btn dcc-tooltip dcc-tooltip-bottom transition-all ${
                      !canUndo ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'hover:bg-editor-hover text-txt-primary'
                    }`}
                    data-tip={undoTip}
                  >
                    <UndoIcon />
                  </button>
                  <button
                    onClick={() => redo()}
                    disabled={!canRedo}
                    className={`tool-shelf-btn dcc-tooltip dcc-tooltip-bottom transition-all ${
                      !canRedo ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'hover:bg-editor-hover text-txt-primary'
                    }`}
                    data-tip={redoTip}
                  >
                    <RedoIcon />
                  </button>
                </>
              );
            })()}
            <button onClick={() => deleteSelected()} className="tool-shelf-btn dcc-tooltip dcc-tooltip-bottom text-status-error/80 hover:text-status-error hover:bg-status-error/10" data-tip="حذف المحدد (Del)">
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Left Section in RTL: View Modes & Audio & Help */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { Sounds.playClick(); toggleBlueprintMode(); }}
            className={`dcc-btn text-xs gap-1.5 py-1.5 px-2.5 rounded-lg ${blueprintMode ? 'bg-status-info/20 text-status-info border-status-info/40' : ''}`}
            title="تبديل إلى نمط المخطط الهندسي الأزرق"
          >
            <BlueprintIcon />
            <span className="hidden md:inline">نمط المخطط</span>
          </button>

          {/* Sound Controls with Menu */}
          <div className="relative">
            <div className="flex items-center rounded-lg bg-editor-hover/40 border border-editor-border/60 p-0.5">
              <button
                onClick={() => { toggleSound(); Sounds.playClick(); }}
                className={`tool-shelf-btn rounded-md px-2 py-1.5 flex items-center gap-1.5 transition-colors ${soundEnabled ? 'text-txt-primary' : 'text-txt-muted opacity-50'}`}
                title={soundEnabled ? 'كتم المؤثرات الصوتية' : 'تشغيل المؤثرات الصوتية'}
              >
                <SoundIcon on={soundEnabled} />
                <span className="text-[11px] font-medium hidden lg:inline">
                  {soundEnabled ? `${Math.round(soundVolume * 100)}%` : 'صامت'}
                </span>
              </button>

              <button
                onClick={() => { setSoundMenuOpen(!soundMenuOpen); Sounds.playClick(); }}
                className={`p-1.5 rounded-md hover:bg-editor-hover text-txt-muted hover:text-txt-primary transition-colors ${soundMenuOpen ? 'bg-editor-hover text-accent' : ''}`}
                title="إعدادات الصوت والأنماط"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${soundMenuOpen ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>

            {/* Sound Settings Popover */}
            {soundMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSoundMenuOpen(false)} />
                <div className="absolute top-full left-0 mt-2 dcc-panel rounded-2xl shadow-card-elevated z-50 w-80 p-4 border border-editor-border/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-right select-none">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-editor-divider">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-forest-500/15 text-forest-400 flex items-center justify-center">
                        <SoundIcon on={soundEnabled} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-txt-primary">المؤثرات الصوتية</div>
                        <div className="text-[10px] text-txt-muted">صوتيات ناعمة ومريحة للأذن</div>
                      </div>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button
                      onClick={() => { toggleSound(); Sounds.playClick(); }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${soundEnabled ? 'bg-forest-500' : 'bg-editor-border'}`}
                      title={soundEnabled ? 'تعطيل الصوت' : 'تفعيل الصوت'}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Volume Slider */}
                  <div className="py-3 border-b border-editor-divider">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-txt-muted text-[11px] font-medium">مستوى الصوت</span>
                      <span className="text-txt-primary text-[11px] font-bold font-mono">{Math.round(soundVolume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-50">🔈</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundVolume}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setSoundVolume(v);
                          if (!soundEnabled && v > 0) toggleSound();
                        }}
                        onMouseUp={() => Sounds.playClick()}
                        className="w-full accent-forest-500 h-1.5 bg-editor-hover rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs opacity-80">🔊</span>
                    </div>
                  </div>

                  {/* Sound Profiles */}
                  <div className="py-3 border-b border-editor-divider">
                    <div className="text-[11px] font-bold text-txt-muted mb-2">نمط الصوت المفضل</div>
                    <div className="space-y-1.5">
                      {[
                        {
                          id: 'organic',
                          title: 'طبيعي كشفي (خشب وحبال)',
                          desc: 'نقرات خشب ماريمبا دافئة وشد حبال انسيابي (موصى به)',
                          icon: '🪵'
                        },
                        {
                          id: 'modern',
                          title: 'عصري ناعم (Minimal Modern)',
                          desc: 'نقرات لمسية خفيفة ونغمات هوائية سريعة',
                          icon: '✨'
                        },
                        {
                          id: 'tactile',
                          title: 'ميكانيكي هادئ (Soft Tactile)',
                          desc: 'نقرات مفاتيح دقيقة بدون أي إزعاج',
                          icon: '⌨️'
                        }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSoundProfile(item.id as SoundProfile);
                            setTimeout(() => Sounds.playWoodTap(), 20);
                          }}
                          className={`w-full text-right p-2 rounded-xl text-xs flex items-start gap-2.5 transition-all ${soundProfile === item.id ? 'bg-forest-500/15 border border-forest-500/40 text-forest-300' : 'hover:bg-editor-hover/70 text-txt-muted'}`}
                        >
                          <span className="text-base leading-none mt-0.5">{item.icon}</span>
                          <div className="flex-1">
                            <div className="font-bold text-[11px] text-txt-primary flex items-center justify-between">
                              <span>{item.title}</span>
                              {soundProfile === item.id && <span className="text-forest-400 text-[10px]">✓ نشط</span>}
                            </div>
                            <div className="text-[10px] text-txt-muted mt-0.5 leading-tight">{item.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sound Preview Pills */}
                  <div className="pt-3">
                    <div className="text-[11px] font-bold text-txt-muted mb-2">معاينة وتجربة الأصوات</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => Sounds.playClick()}
                        className="px-2 py-1.5 rounded-lg bg-editor-hover hover:bg-editor-hover/80 text-[10px] font-semibold text-txt-secondary hover:text-txt-primary transition-colors flex items-center justify-center gap-1"
                        title="معاينة نقرة الواجهة"
                      >
                        <span>🖱️</span>
                        <span>نقر واجهة</span>
                      </button>
                      <button
                        onClick={() => Sounds.playWoodTap()}
                        className="px-2 py-1.5 rounded-lg bg-editor-hover hover:bg-editor-hover/80 text-[10px] font-semibold text-txt-secondary hover:text-txt-primary transition-colors flex items-center justify-center gap-1"
                        title="معاينة تثبيت الأخشاب"
                      >
                        <span>🪵</span>
                        <span>خشب</span>
                      </button>
                      <button
                        onClick={() => Sounds.playRope()}
                        className="px-2 py-1.5 rounded-lg bg-editor-hover hover:bg-editor-hover/80 text-[10px] font-semibold text-txt-secondary hover:text-txt-primary transition-colors flex items-center justify-center gap-1"
                        title="معاينة شد الحبل"
                      >
                        <span>🪢</span>
                        <span>حبل</span>
                      </button>
                      <button
                        onClick={() => Sounds.playSnap()}
                        className="px-2 py-1.5 rounded-lg bg-editor-hover hover:bg-editor-hover/80 text-[10px] font-semibold text-txt-secondary hover:text-txt-primary transition-colors flex items-center justify-center gap-1"
                        title="معاينة المحاذاة الذكية"
                      >
                        <span>🧲</span>
                        <span>محاذاة</span>
                      </button>
                      <button
                        onClick={() => Sounds.playCollapse()}
                        className="px-2 py-1.5 rounded-lg bg-editor-hover hover:bg-editor-hover/80 text-[10px] font-semibold text-txt-secondary hover:text-txt-primary transition-colors flex items-center justify-center gap-1"
                        title="معاينة تساقط الأخشاب"
                      >
                        <span>🪜</span>
                        <span>تهاوي</span>
                      </button>
                      <button
                        onClick={() => Sounds.playSuccess()}
                        className="px-2 py-1.5 rounded-lg bg-editor-hover hover:bg-editor-hover/80 text-[10px] font-semibold text-txt-secondary hover:text-txt-primary transition-colors flex items-center justify-center gap-1"
                        title="معاينة نغمة النجاح"
                      >
                        <span>✨</span>
                        <span>نجاح</span>
                      </button>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>

          <button
            onClick={onShowHelp}
            className="dcc-btn text-xs font-bold gap-1.5 py-1.5 px-3 rounded-lg bg-editor-hover/80 hover:bg-editor-hover text-txt-primary border border-editor-border"
            title="دليل الاختصارات والاستخدام"
          >
            <HelpIcon />
            <span className="hidden sm:inline">دليل المساعدة</span>
          </button>
        </div>
      </header>

      {/* Confirmation Modal for Clearing Scene (Safety UX) */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="dcc-panel rounded-2xl max-w-md w-full p-6 shadow-card-elevated border border-status-error/30 animate-in fade-in zoom-in-95 duration-150 text-right">
            <div className="flex items-center gap-3 text-status-error mb-3">
              <div className="w-10 h-10 rounded-full bg-status-error/20 flex items-center justify-center text-xl">
                ⚠️
              </div>
              <h3 className="font-bold text-base text-txt-primary">تأكيد تفريغ المشهد</h3>
            </div>
            <p className="text-xs text-txt-secondary leading-relaxed mb-6">
              هل أنت متأكد من رغبتك في حذف جميع الأخشاب والربطات والأوتاد من المشهد الحالي؟ لا يمكن التراجع عن هذا الإجراء إلا عبر أمر التراجع [Ctrl+Z].
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="dcc-btn px-4 py-2 text-xs font-semibold rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  clearScene();
                  setConfirmClearOpen(false);
                  triggerToast('تم تفريغ المشهد بنجاح');
                }}
                className="px-4 py-2 text-xs font-bold bg-status-error hover:bg-status-error/90 text-white rounded-lg transition-colors shadow-sm"
              >
                نعم، تفريغ المشهد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-forest-900/90 border border-forest-500/40 text-forest-200 px-4 py-2 rounded-xl shadow-glow-emerald backdrop-blur-md text-xs font-bold flex items-center gap-2 slide-up">
          <span className="text-forest-400 text-sm">✓</span>
          {toastMessage}
        </div>
      )}

      {/* Comprehensive Camp Land Report Modal (Interactive Preview & PDF Export) */}
      {reportModalOpen && reportData && (
        <CampReportModal
          isOpen={reportModalOpen}
          snapshots={reportSnapshots}
          reportData={reportData}
          onClose={() => setReportModalOpen(false)}
          onRetakeSnapshots={handleOpenReport}
        />
      )}

      {/* Online 3D Showcase & QR Share Modal */}
      {shareModalOpen && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </>
  );
};

export default Toolbar;
