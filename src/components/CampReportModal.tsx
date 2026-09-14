import React, { useState, useRef } from 'react';
import type { CampSnapshot, CampReportData } from '../utils/reportGenerator';
import { exportCampReportToPDF } from '../utils/reportGenerator';
import { Sounds } from '../utils/sound';
import { useStore } from '../store/useStore';

interface CampReportModalProps {
  snapshots: CampSnapshot[];
  reportData: CampReportData;
  isOpen: boolean;
  onClose: () => void;
  onRetakeSnapshots: () => void;
}

export const CampReportModal: React.FC<CampReportModalProps> = ({
  snapshots,
  reportData: initialData,
  isOpen,
  onClose,
  onRetakeSnapshots
}) => {
  const [reportData, setReportData] = useState<CampReportData>(initialData);
  const [exporting, setExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'p1' | 'p2' | 'p3'>('all');
  const [activeImageModal, setActiveImageModal] = useState<CampSnapshot | null>(null);

  const toggleAssumeAllInsideBoundary = useStore(state => state.toggleAssumeAllInsideBoundary);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleToggleComplianceOverride = () => {
    Sounds.playClick();
    const newAssume = !reportData.assumeAllInsideBoundary;
    toggleAssumeAllInsideBoundary(newAssume);
    setReportData(prev => ({
      ...prev,
      assumeAllInsideBoundary: newAssume,
      isBoundaryCompliant: newAssume ? true : initialData.outOfBoundsCount === 0,
      outOfBoundsCount: newAssume ? 0 : initialData.outOfBoundsCount,
      safetyChecks: prev.safetyChecks.map(chk => {
        if (chk.id === 'bounds') {
          return {
            ...chk,
            status: newAssume ? 'pass' : (initialData.outOfBoundsCount === 0 ? 'pass' : 'warning'),
            detailAr: newAssume
              ? 'كافة الأخشاب والأوتاد معتمدة بالكامل بنسبة 100% داخل الحيز الهندسي المخصص للمخيم (نظام التشوين المعتمد).'
              : (initialData.outOfBoundsCount === 0 
                  ? 'كافة الأخشاب والأوتاد تقع بالكامل بنسبة 100% داخل الحيز الهندسي المخصص للمخيم.'
                  : `تنبيه: يوجد ${initialData.outOfBoundsCount} عنصر متجاوز لحدود موقع الأرض المحددة، يُرجى مراجعة التموضع.`)
          };
        }
        return chk;
      })
    }));
  };

  const handleExportPDF = async () => {
    if (!reportContainerRef.current) return;
    try {
      Sounds.playClick();
      setExporting(true);
      const safeName = `${reportData.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportCampReportToPDF(reportContainerRef.current, safeName, (step) => {
        setProgressMsg(step);
      });
      Sounds.playClick();
    } catch (err: unknown) {
      console.error('Failed to export PDF:', err);
      const message = err instanceof Error ? err.message : 'يرجى المحاولة مرة أخرى';
      alert('حدث خطأ أثناء تصدير ملف الـ PDF: ' + message);
    } finally {
      setExporting(false);
      setProgressMsg('');
    }
  };

  const handlePrint = () => {
    Sounds.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-md overflow-hidden text-right font-sans">
      {/* Top Controls Bar */}
      <header className="h-16 px-6 bg-editor-surface/95 border-b border-editor-border flex items-center justify-between shrink-0 shadow-lg no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-600/20 border border-forest-500/40 flex items-center justify-center text-xl shadow-glow-emerald">
            📑
          </div>
          <div>
            <h2 className="text-base font-bold text-txt-primary flex items-center gap-2">
              <span>تقرير توثيق وتخطيط أرض جامعة المنوفية</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                فكرة المعبد الفرعوني
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-forest-500/20 text-forest-300 border border-forest-500/30">
                A4 PDF جاهز للطباعة
              </span>
            </h2>
            <p className="text-[11px] text-txt-muted">
              وثيقة معمارية وهندسية كشفية شاملة لأبعاد ومواصفات الأرض واللقطات لجامعة المنوفية
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick page switcher tabs */}
          <div className="hidden lg:flex items-center bg-editor-panel p-1 rounded-xl border border-editor-divider text-xs ml-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'all' ? 'bg-forest-600 text-white shadow-xs' : 'text-txt-muted hover:text-txt-primary'
              }`}
            >
              عرض كامل (3 صفحات)
            </button>
            <button
              onClick={() => setActiveTab('p1')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'p1' ? 'bg-forest-600 text-white shadow-xs' : 'text-txt-muted hover:text-txt-primary'
              }`}
            >
              صفحة 1: الصور والحدود
            </button>
            <button
              onClick={() => setActiveTab('p2')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'p2' ? 'bg-forest-600 text-white shadow-xs' : 'text-txt-muted hover:text-txt-primary'
              }`}
            >
              صفحة 2: حصر الكميات
            </button>
            <button
              onClick={() => setActiveTab('p3')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'p3' ? 'bg-forest-600 text-white shadow-xs' : 'text-txt-muted hover:text-txt-primary'
              }`}
            >
              صفحة 3: السلامة والاعتماد
            </button>
          </div>

          <button
            onClick={handleToggleComplianceOverride}
            disabled={exporting}
            className={`dcc-btn px-3 py-2 text-xs font-bold gap-1.5 rounded-xl border transition-all cursor-pointer ${
              reportData.assumeAllInsideBoundary
                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                : 'border-editor-border hover:bg-editor-hover text-txt-secondary'
            }`}
            title="اعتماد كافة الأخشاب داخل الحيز المطلوب تلقائياً (السماح بتشوين الخشب خارج الأرض)"
          >
            <span>{reportData.assumeAllInsideBoundary ? '✓' : '📦'}</span>
            <span className="hidden sm:inline">
              {reportData.assumeAllInsideBoundary ? 'الخشب معتمد داخل الأرض 100%' : 'اعتماد كل الخشب داخل الأرض'}
            </span>
          </button>

          <button
            onClick={onRetakeSnapshots}
            disabled={exporting}
            className="dcc-btn px-3 py-2 text-xs font-bold gap-1.5 rounded-xl border border-editor-border hover:bg-editor-hover text-txt-secondary"
            title="إعادة توجيه الكاميرا والتقاط زوايا الأرض من جديد"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">إعادة التقاط اللقطات</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={exporting}
            className="dcc-btn px-3.5 py-2 text-xs font-bold gap-1.5 rounded-xl border border-status-info/40 bg-status-info/10 text-status-info hover:bg-status-info/20"
            title="طباعة عبر المتصفح أو حفظ كـ PDF Vector"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <path d="M6 14h12v8H6z" />
            </svg>
            <span className="hidden sm:inline">طباعة فورية / Vector</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-forest-600 hover:bg-forest-500 text-white shadow-glow-emerald transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>{progressMsg || 'جارٍ التصدير...'}</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                <span>تحميل ملف PDF (A4)</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2 text-txt-muted hover:text-txt-primary hover:bg-editor-hover rounded-xl text-lg transition-colors ml-2"
            title="إغلاق التقرير"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Editable Metadata Sub-bar */}
      <div className="bg-editor-panel/90 px-6 py-2 border-b border-editor-divider flex flex-wrap items-center justify-between gap-4 text-xs shrink-0 no-print">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-txt-muted font-bold">اسم المشروع:</span>
            <input
              type="text"
              value={reportData.projectName}
              onChange={(e) => setReportData({ ...reportData, projectName: e.target.value })}
              className="bg-editor-surface px-2.5 py-1 rounded-lg border border-editor-border text-txt-primary font-bold w-52 focus:outline-hidden focus:border-forest-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-txt-muted font-bold">المجموعة / العشيرة:</span>
            <input
              type="text"
              value={reportData.scoutGroup}
              onChange={(e) => setReportData({ ...reportData, scoutGroup: e.target.value })}
              className="bg-editor-surface px-2.5 py-1 rounded-lg border border-editor-border text-txt-primary font-bold w-48 focus:outline-hidden focus:border-forest-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-txt-muted font-bold">المصمم / القائد:</span>
            <input
              type="text"
              value={reportData.leaderName}
              onChange={(e) => setReportData({ ...reportData, leaderName: e.target.value })}
              className="bg-editor-surface px-2.5 py-1 rounded-lg border border-editor-border text-txt-primary font-bold w-40 focus:outline-hidden focus:border-forest-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-txt-muted font-bold">فكرة الأرض:</span>
            <input
              type="text"
              value={reportData.landTheme}
              onChange={(e) => setReportData({ ...reportData, landTheme: e.target.value })}
              className="bg-editor-surface px-2.5 py-1 rounded-lg border border-editor-border text-txt-primary font-bold w-56 focus:outline-hidden focus:border-forest-500"
            />
          </div>
        </div>

        <div className="text-txt-muted text-[11px]">
          <span>📅 {reportData.dateStr}</span>
        </div>
      </div>

      {/* Report Scrollable Viewport (Preview of A4 Sheets) */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center gap-8 bg-[#0a0f16]">
        {/* Printable & Exportable Container */}
        <div ref={reportContainerRef} className="camp-report-export-root flex flex-col gap-10">
          
          {/* ============================================================== */}
          {/* PAGE 1: COVER, LAND SPECS & 4-ANGLE 3D PHOTOGRAPHIC GALLERY  */}
          {/* ============================================================== */}
          {(activeTab === 'all' || activeTab === 'p1') && (
            <div dir="rtl" className="report-page-a4 w-[210mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-800 p-8 shadow-2xl relative flex flex-col justify-between overflow-hidden box-border text-right select-text">
              {/* Header Decorative Banner */}
              <div>
                <div className="flex items-start justify-between border-b-2 border-emerald-700 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                      ⚜️
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 block">
                        الجمعية الكشفية • تقرير توثيق موقع الأرض
                      </span>
                      <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                        {reportData.projectName}
                      </h1>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
                        <span className="font-bold text-emerald-700">{reportData.scoutGroup}</span>
                        <span>•</span>
                        <span>إعداد: {reportData.leaderName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left text-[11px] text-slate-500 space-y-0.5">
                    <div className="font-bold text-slate-800 font-mono text-xs" dir="ltr">DOCUMENT: SC-SITE-REP</div>
                    <div className="text-slate-600 font-medium">{reportData.dateStr}</div>
                    <div className="text-emerald-700 font-bold font-mono text-[10px]" dir="ltr">REV: 1.0 • APPROVED</div>
                  </div>
                </div>

                {/* Land Specifications & Geometry Cards */}
                <div className="grid grid-cols-4 gap-2.5 mb-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">أبعاد الأرض المحددة</span>
                    <span className="text-base font-extrabold text-emerald-800">
                      <span className="font-mono">{reportData.boundaryWidth} × {reportData.boundaryLength}</span> م
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">العرض X × الطول Z</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">المساحة الإجمالية</span>
                    <span className="text-base font-extrabold text-emerald-800">
                      <span className="font-mono">{reportData.boundaryArea}</span> م²
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">مساحة موقع المخيم</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">محيط سياج الأرض</span>
                    <span className="text-base font-extrabold text-emerald-800">
                      <span className="font-mono">{reportData.boundaryPerimeter}</span> م
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">طول الحيز الكلي</span>
                  </div>

                  <div 
                    onClick={handleToggleComplianceOverride}
                    title="انقر لتبديل حالة اعتماد كافة الأخشاب داخل المساحة"
                    className={`border rounded-xl p-2.5 text-center cursor-pointer transition-all hover:scale-102 ${
                      reportData.isBoundaryCompliant 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs' 
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}
                  >
                    <span className="text-[10px] font-bold block mb-0.5">مطابقة الحدود</span>
                    <span className="text-xs font-bold flex items-center justify-center gap-1 mt-0.5">
                      {reportData.isBoundaryCompliant ? '✓ مطابق 100%' : `⚠️ تجاوز (${reportData.outOfBoundsCount})`}
                    </span>
                    <span className="text-[9px] opacity-80 block mt-0.5">
                      {reportData.assumeAllInsideBoundary ? 'اعتماد شامل (تشوين مسموح)' : reportData.boundaryAlignmentAr}
                    </span>
                  </div>
                </div>

                {/* قسم فكرة الأرض: المعبد الفرعوني */}
                <div className="mb-3 bg-amber-50/70 border border-amber-200 rounded-xl p-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/80 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏛️</span>
                      <h3 className="text-xs font-bold text-amber-950">
                        فكرة الأرض: <span className="text-amber-800">{reportData.landTheme}</span>
                      </h3>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300/80">
                      معبد فرعوني
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700 leading-relaxed mb-2.5">
                    {reportData.themeDescription}
                  </p>

                  {/* Components */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="font-bold text-slate-600">مكونات الأرض:</span>
                    {reportData.themeElements?.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md bg-white border border-amber-200 text-amber-950 font-bold shadow-2xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* THE 4 REQUIRED 3D CAMERA ANGLE SNAPSHOTS */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="text-emerald-700">📸</span> لقطات للموقع من زوايا هندسية متعددة (معرض الصور ثلاثية الأبعاد)
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">
                      ريندر معماري ثلاثي الأبعاد مقرب عالي الدقة (300 DPI)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {snapshots.slice(0, 4).map((shot, idx) => (
                      <div 
                        key={shot.id} 
                        className="group border border-slate-200 rounded-xl overflow-hidden bg-slate-900 shadow-xs hover:shadow-md transition-all flex flex-col"
                      >
                        {/* Snapshot Image Container */}
                        <div 
                          className="relative aspect-16/9 bg-slate-950 overflow-hidden cursor-pointer"
                          onClick={() => setActiveImageModal(shot)}
                        >
                          <img
                            src={shot.dataUrl}
                            alt={shot.titleAr}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          />
                          <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>زاوية #{idx + 1}</span>
                          </div>
                        </div>

                        {/* Snapshot Caption */}
                        <div className="p-2 bg-white border-t border-slate-200 flex-1 flex flex-col justify-between">
                          <div className="font-bold text-[11px] text-slate-900 mb-0.5">
                            {shot.titleAr}
                          </div>
                          <p className="text-[9.5px] text-slate-600 leading-snug line-clamp-1">
                            {shot.descriptionAr}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Page 1 Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 mt-4">
                <span className="font-mono" dir="ltr">PIONEERING SCOUT SIMULATOR • REPORT ENGINE v2.4</span>
                <span>الصفحة 1 من 3 • اللقطات المعمارية وحدود الأرض</span>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PAGE 2: BILL OF MATERIALS & SPECIFICATIONS (الأخشاب، الربطات، الأوتاد) */}
          {/* ============================================================== */}
          {(activeTab === 'all' || activeTab === 'p2') && (
            <div dir="rtl" className="report-page-a4 w-[210mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-800 p-8 shadow-2xl relative flex flex-col justify-between overflow-hidden box-border text-right select-text">
              <div>
                {/* Page 2 Mini Header */}
                <div className="flex items-center justify-between border-b-2 border-emerald-700 pb-3 mb-4">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 block">
                      جداول حصر الكميات والمواصفات الهندسية (جدول الحصر والمواد)
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900">
                      حصر وتوصيف الأخشاب، الربطات، الأوتاد واستهلاك الحبال
                    </h2>
                  </div>
                  <div className="text-left text-[11px] text-slate-500">
                    <span className="font-bold text-slate-800">{reportData.projectName}</span>
                    <br />
                    <span className="text-slate-600">موقع الأرض: <span className="font-mono">{reportData.boundaryWidth} × {reportData.boundaryLength}</span> م</span>
                  </div>
                </div>

                {/* KPI Overview Banner */}
                <div className="grid grid-cols-5 gap-2.5 mb-5">
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-amber-800 block">إجمالي الأخشاب</span>
                    <span className="text-lg font-extrabold text-amber-900 font-mono">{reportData.totalSparsCount}</span>
                    <span className="text-[9px] text-amber-700 block">عصا وقطعة خشب</span>
                  </div>

                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-amber-800 block">أطوال الأخشاب</span>
                    <span className="text-lg font-extrabold text-amber-900 font-mono">{reportData.totalSparsLength} م</span>
                    <span className="text-[9px] text-amber-700 block">مجموع الأمتار الطولية</span>
                  </div>

                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-amber-800 block">الوزن التقديري</span>
                    <span className="text-lg font-extrabold text-amber-900 font-mono">{reportData.totalSparsWeight} كجم</span>
                    <span className="text-[9px] text-amber-700 block">كتلة الهياكل الكلية</span>
                  </div>

                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-indigo-800 block">إجمالي الربطات</span>
                    <span className="text-lg font-extrabold text-indigo-900 font-mono">{reportData.totalLashingsCount}</span>
                    <span className="text-[9px] text-indigo-700 block">عقدة ودورة كشفية</span>
                  </div>

                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-indigo-800 block">استهلاك الحبال</span>
                    <span className="text-lg font-extrabold text-indigo-900 font-mono">{reportData.totalRopeLength} م</span>
                    <span className="text-[9px] text-indigo-700 block">حبل سيزال / مانيلا</span>
                  </div>
                </div>

                {/* Table 1: Spars Inventory */}
                <div className="mb-5">
                  <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <span>🪵</span> أولاً: جدول حصر وتوصيف الأخشاب الكشفية (Timber Schedule)
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="py-2 px-3">م</th>
                          <th className="py-2 px-3">نوع الخشب والمقاس القياسي</th>
                          <th className="py-2 px-3">القطر الاسمي</th>
                          <th className="py-2 px-3 text-center">العدد</th>
                          <th className="py-2 px-3 text-center">إجمالي الطول</th>
                          <th className="py-2 px-3 text-center">الوزن التقديري</th>
                          <th className="py-2 px-3">الاستخدام النموذجي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-[11px]">
                        {reportData.sparsByType.map((item, idx) => (
                          <tr key={item.type} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{item.labelAr}</td>
                            <td className="py-2 px-3 text-slate-600">
                              {item.type === 'stave' ? '5 سم' : item.type === 'medium' ? '8 سم' : '10 سم'}
                            </td>
                            <td className="py-2 px-3 text-center font-bold font-mono text-amber-900">{item.count}</td>
                            <td className="py-2 px-3 text-center font-mono">{item.totalLen} م</td>
                            <td className="py-2 px-3 text-center font-mono">{item.weight} كجم</td>
                            <td className="py-2 px-3 text-slate-600 text-[10px]">
                              {item.type === 'stave' && 'قوائم خيام، أدراج، مساند، درابزين'}
                              {item.type === 'medium' && 'جسور، مدرجات، عوارض، أذرع شد'}
                              {item.type === 'long' && 'أرجل أبراج، سواري أعلام، قواعد بوابات'}
                              {item.type === 'xlong' && 'سواري عملاقة، أبراج مراقبة رئيسية'}
                              {item.type === 'custom' && 'قطع تفصيلية مخصصة'}
                            </td>
                          </tr>
                        ))}
                        {reportData.sparsByType.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-slate-400">
                              لا توجد أخشاب مضافة في المشهد الحالي
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200 text-[11px]">
                        <tr>
                          <td colSpan={3} className="py-2 px-3">الإجمالي العام للأخشاب</td>
                          <td className="py-2 px-3 text-center font-mono text-emerald-800">{reportData.totalSparsCount}</td>
                          <td className="py-2 px-3 text-center font-mono text-emerald-800">{reportData.totalSparsLength} م</td>
                          <td className="py-2 px-3 text-center font-mono text-emerald-800">{reportData.totalSparsWeight} كجم</td>
                          <td className="py-2 px-3 text-[10px] text-slate-500">أعلى ارتفاع: {reportData.maxHeight} م</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Table 2: Lashings & Rope Inventory */}
                <div className="mb-5">
                  <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <span>🪢</span> ثانياً: جدول العقد والدورات والربطات الكشفية (Lashings Schedule)
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="py-2 px-3">م</th>
                          <th className="py-2 px-3">نوع الربطة الكشفية</th>
                          <th className="py-2 px-3 text-center">العدد</th>
                          <th className="py-2 px-3 text-center">معدل طول الحبل</th>
                          <th className="py-2 px-3 text-center">إجمالي الحبال المقدرة</th>
                          <th className="py-2 px-3">الوظيفة الإنشائية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-[11px]">
                        {reportData.lashingsByType.map((item, idx) => (
                          <tr key={item.type} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{item.labelAr}</td>
                            <td className="py-2 px-3 text-center font-bold font-mono text-indigo-900">{item.count}</td>
                            <td className="py-2 px-3 text-center font-mono text-slate-600">
                              {item.type === 'square' ? '5.5 م' : item.type === 'diagonal' ? '6.0 م' : item.type === 'tripod' ? '7.5 م' : '4.5 م'}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-indigo-800">{item.estimatedRope} م</td>
                            <td className="py-2 px-3 text-slate-600 text-[10px]">
                              {item.type === 'square' && 'تثبيت الأخشاب المتعامدة بزاوية 90° ونقل الأحمال الرأسية'}
                              {item.type === 'diagonal' && 'مقاومة قوى الانفتال والالتواء وتثبيت التقاطعات المائلة'}
                              {item.type === 'shear' && 'ضم خشبين متوازيين لزيادة الطول أو تشكيل مقص'}
                              {item.type === 'tripod' && 'تشكيل الهياكل الهرمية وقواعد الأبراج الحاملة'}
                            </td>
                          </tr>
                        ))}
                        {reportData.lashingsByType.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-4 text-slate-400">
                              لا توجد ربطات مضافة في المشهد الحالي
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 3: Stakes & Guy Lines */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <span>⚓</span> ثالثاً: منظومة التثبيت الأرضي والأوتاد وحبال الشد (Anchorage System)
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 block">أوتاد التثبيت في الأرض</span>
                      <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                        {reportData.stakesCount} أوتاد خشبية / حديدية
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        زاوية الغرس المثلى: 45° عكس اتجاه الشد
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 block">حبال الشد الهندسية (Guy Lines)</span>
                      <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                        {reportData.guyLinesCount} حبال شد مجهزة
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        إجمالي أطوال حبال الشد: {reportData.totalGuyLineRopeLength} متر
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 block">أقصى ارتفاع للهيكل</span>
                      <span className="text-base font-bold text-emerald-800 font-mono mt-0.5 block">
                        {reportData.maxHeight} متر عن سطح الأرض
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {reportData.maxHeight > 3 ? 'يتطلب تثبيت مشدد بأوتاد' : 'ارتفاع منخفض وآمن'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 2 Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 mt-4">
                <span className="font-mono" dir="ltr">PIONEERING SCOUT SIMULATOR • REPORT ENGINE v2.4</span>
                <span>الصفحة 2 من 3 • حصر الكميات والمواد المستهلكة</span>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PAGE 3: DISTANCES, SAFETY AUDIT, NOTES & OFFICIAL SIGN-OFFS   */}
          {/* ============================================================== */}
          {(activeTab === 'all' || activeTab === 'p3') && (
            <div dir="rtl" className="report-page-a4 w-[210mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-800 p-8 shadow-2xl relative flex flex-col justify-between overflow-hidden box-border text-right select-text">
              <div>
                {/* Page 3 Mini Header */}
                <div className="flex items-center justify-between border-b-2 border-emerald-700 pb-3 mb-4">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 block">
                      المسافات الهندسية وتقرير السلامة والاعتماد الرسمي
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900">
                      محضر التدقيق الفني الكشفي واعتماد القادة
                    </h2>
                  </div>
                  <div className="text-left text-[11px] text-slate-500">
                    <span className="font-bold text-slate-800">{reportData.scoutGroup}</span>
                    <br />
                    <span className="text-slate-600">تاريخ الإصدار: {reportData.dateStr.split('-')[0]}</span>
                  </div>
                </div>

                {/* Guide Lines & Measured Distances Table (If any exist) */}
                {reportData.measuredDistances.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <span>📏</span> أولاً: جدول قياسات المسافات الهندسية بين النقاط (Site Measurements)
                    </h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                          <tr>
                            <th className="py-2 px-3">م</th>
                            <th className="py-2 px-3">اسم القياس الهندسي</th>
                            <th className="py-2 px-3 text-center">المسافة المقاسة</th>
                            <th className="py-2 px-3 text-center">إحداثيات البداية</th>
                            <th className="py-2 px-3 text-center">إحداثيات النهاية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-[11px]">
                          {reportData.measuredDistances.map((m, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                              <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                              <td className="py-2 px-3 font-bold text-slate-900">{m.name}</td>
                              <td className="py-2 px-3 text-center font-bold font-mono text-emerald-800">{m.distance} م</td>
                              <td className="py-2 px-3 text-center font-mono text-slate-600">{m.startPoint}</td>
                              <td className="py-2 px-3 text-center font-mono text-slate-600">{m.endPoint}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Safety Audit & Structural Integrity Checklist */}
                <div className="mb-5">
                  <h3 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
                    <span>🛡️</span> ثانياً: تقرير تدقيق السلامة والمتانة الهندسية (Safety & Compliance Audit)
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {reportData.safetyChecks.map((chk) => (
                      <div
                        key={chk.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between ${
                          chk.status === 'pass'
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : chk.status === 'warning'
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-900">{chk.titleAr}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              chk.status === 'pass'
                                ? 'bg-emerald-600 text-white'
                                : chk.status === 'warning'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-300 text-slate-700'
                            }`}
                          >
                            {chk.status === 'pass' ? 'معتمد ✓' : chk.status === 'warning' ? 'تنبيه ⚠️' : 'ملاحظة ℹ️'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed">{chk.detailAr}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Editable Field Notes */}
                <div className="mb-5">
                  <h3 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <span>📝</span> ثالثاً: التوجيهات والملاحظات الميدانية للتنفيذ
                  </h3>
                  <textarea
                    value={reportData.notes}
                    onChange={(e) => setReportData({ ...reportData, notes: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:border-emerald-600"
                    placeholder="اكتب أي ملاحظات أو تعليمات خاصة بفريق البناء الميداني..."
                  />
                </div>

                {/* Sign-Off & Approvals Section */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <span>✍️</span> رابعاً: محضر الاعتماد والتسليم الكشفي الرسمي (Official Sign-offs)
                  </h3>
                  <div className="grid grid-cols-3 gap-3 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="text-center flex flex-col justify-between h-28 border-l border-slate-200 pl-2">
                      <div>
                        <span className="text-[11px] font-bold text-slate-800 block">مصمم ومخطط المشروع</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">قائد الطليعة / المهندس</span>
                      </div>
                      <div className="border-b border-dashed border-slate-400 mx-4" />
                      <div>
                        <span className="text-xs font-bold text-emerald-800">{reportData.leaderName}</span>
                        <span className="text-[9px] text-slate-500 block">تاريخ: {new Date().toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>

                    <div className="text-center flex flex-col justify-between h-28 border-l border-slate-200 px-2">
                      <div>
                        <span className="text-[11px] font-bold text-slate-800 block">مسؤول العهد والتجهيزات</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">أمين المهمات (Quartermaster)</span>
                      </div>
                      <div className="border-b border-dashed border-slate-400 mx-4" />
                      <div>
                        <span className="text-xs font-bold text-slate-700">التوقيع والاعتماد</span>
                        <span className="text-[9px] text-slate-500 block">تم حصر الأخشاب والحبال</span>
                      </div>
                    </div>

                    <div className="text-center flex flex-col justify-between h-28 pr-2">
                      <div>
                        <span className="text-[11px] font-bold text-slate-800 block">قائد عام المعسكر / التدريب</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">المشرف الفني الكشفي</span>
                      </div>
                      <div className="w-14 h-14 mx-auto border-2 border-dashed border-emerald-400 rounded-full flex items-center justify-center text-[10px] text-emerald-700 font-bold rotate-12">
                        ختم الاعتماد
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">وثيقة رسمية معتمدة</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 3 Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 mt-4">
                <span className="font-mono" dir="ltr">PIONEERING SCOUT SIMULATOR • REPORT ENGINE v2.4</span>
                <span>الصفحة 3 من 3 • المسافات الهندسية ومحضر الاعتماد الرسمي</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {activeImageModal && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-pointer"
          onClick={() => setActiveImageModal(null)}
        >
          <div className="max-w-4xl w-full bg-editor-surface rounded-2xl overflow-hidden border border-editor-border shadow-2xl p-4 cursor-default" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-editor-divider mb-3">
              <h4 className="font-bold text-sm text-txt-primary">{activeImageModal.titleAr}</h4>
              <button onClick={() => setActiveImageModal(null)} className="text-txt-muted hover:text-txt-primary text-sm p-1">✕</button>
            </div>
            <div className="aspect-16/10 bg-black rounded-xl overflow-hidden mb-3">
              <img src={activeImageModal.dataUrl} alt={activeImageModal.titleAr} className="w-full h-full object-contain" />
            </div>
            <p className="text-xs text-txt-secondary">{activeImageModal.descriptionAr}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampReportModal;
