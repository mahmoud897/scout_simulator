import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  generateViewerURL, 
  generateQRCodeDataURL, 
  getBaseViewerURL, 
  setBaseViewerURL,
  compactModelData
} from '../utils/shareUtils';
import { Sounds } from '../utils/sound';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const spars = useStore(state => state.spars);
  const lashings = useStore(state => state.lashings);
  const stakes = useStore(state => state.stakes);
  const guyLines = useStore(state => state.guyLines);

  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<string | null>(null);
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(getBaseViewerURL());
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Raw current scene data
  const rawSceneData = useMemo(() => ({
    spars,
    lashings,
    stakes,
    guyLines
  }), [spars, lashings, stakes, guyLines]);

  // Generate full viewer URL
  const viewerUrl = useMemo(() => {
    return generateViewerURL(rawSceneData, customBaseUrl, 'تصميم كشفي ثلاثي الأبعاد');
  }, [rawSceneData, customBaseUrl]);

  // Generate QR Code whenever viewerUrl changes
  useEffect(() => {
    let active = true;
    setLoading(true);

    generateQRCodeDataURL(viewerUrl)
      .then(url => {
        if (active) {
          setQrDataUrl(url);
          setQrError(null);
          setLoading(false);
        }
      })
      .catch(err => {
        if (active) {
          setQrDataUrl('');
          setQrError(err?.message || 'حجم التصميم كبير على رمز QR مباشر (يمكنك مشاركته عبر زر نسخ الرابط)');
          setLoading(false);
        }
      });

    return () => { active = false; };
  }, [viewerUrl]);

  // Handle Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(viewerUrl);
    setCopied(true);
    Sounds.playSuccess();
    setTimeout(() => setCopied(false), 2500);
  };

  // Handle Download QR Image
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `رمز_QR_المعاينة_الكشفية_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
    Sounds.playClick();
  };

  // Handle Download Standalone HTML Bundle
  const handleDownloadStandaloneHTML = async () => {
    try {
      // Fetch viewer.html as template or construct it
      let htmlTemplate = '';
      try {
        const res = await fetch('./viewer.html');
        if (res.ok) {
          htmlTemplate = await res.text();
        }
      } catch {
        // Ignore fetch failure
      }

      const compact = compactModelData(rawSceneData, 'تصميم كشفي ثلاثي الأبعاد');
      const dataScript = `<script>window.__CAMP_MODEL__ = ${JSON.stringify(compact)};</script>`;

      let finalHtml = htmlTemplate;
      if (finalHtml.includes('<!-- Main Three.js Application Logic -->')) {
        finalHtml = finalHtml.replace('<!-- Main Three.js Application Logic -->', `${dataScript}\n<!-- Main Three.js Application Logic -->`);
      } else {
        finalHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${dataScript}<p>جارٍ تحميل النموذج...</p></body></html>`;
      }

      const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `تصميم_كشفي_تفاعلي_${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
      Sounds.playClick();
    } catch (e) {
      console.error(e);
      alert('تعذر توليد ملف الـ HTML المستقل');
    }
  };
  // Save Custom Base URL with auto-correction
  const handleSaveBaseUrl = (newUrl: string) => {
    let clean = newUrl.trim();
    if (clean.endsWith('/viewer.h') || clean.endsWith('/viewer.htm')) {
      clean = clean.replace(/\/viewer\.h(tm)?$/i, '/viewer.html');
    }
    setCustomBaseUrl(clean);
    setBaseViewerURL(clean);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-lg bg-slate-900/95 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-2xl text-right animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-forest-600 to-emerald-400 flex items-center justify-center text-xl shadow-glow-emerald">
              📱
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>مشاركة ومعاينة التصميم</span>
                <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Online 3D
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                امسح الرمز أو انسخ الرابط لفتح المجسم ثلاثي الأبعاد فوراً على أي هاتف
              </p>
            </div>
          </div>
          <button 
            onClick={() => { Sounds.playClick(); onClose(); }}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* QR Code Presentation Box */}
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center mb-4 text-center">
          <div className="relative p-3 bg-white rounded-2xl shadow-xl mb-3 flex items-center justify-center min-w-[190px] min-h-[190px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-600">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold font-sans">توليد الرمز...</span>
              </div>
            ) : qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="QR Code" 
                className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
              />
            ) : (
              <div className="text-xs text-amber-700 bg-amber-50 rounded-xl p-3 max-w-[210px] leading-relaxed text-center font-sans font-medium border border-amber-200">
                ⚠️ {qrError || 'حجم التصميم كبير على رمز QR مباشر. يمكنك مشاركته فوراً عبر زر "نسخ الرابط" في الأسفل.'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadQR}
              disabled={!qrDataUrl || loading}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all hover:border-emerald-500/40 disabled:opacity-50"
            >
              <span>⬇️</span>
              <span>تحميل رمز الـ QR (PNG)</span>
            </button>
          </div>
        </div>

        {/* Web Link Copy Field */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>رابط المعاينة المباشر:</span>
            <span className="text-[10px] text-emerald-400 font-mono">جاهز للمشاركة</span>
          </label>
          <div className="flex items-center gap-1.5 bg-slate-950 border border-white/10 rounded-xl p-1">
            <input 
              type="text" 
              readOnly 
              value={viewerUrl}
              className="bg-transparent text-xs text-slate-300 px-2 py-1.5 flex-1 font-mono outline-none truncate text-left"
              dir="ltr"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                copied 
                  ? 'bg-emerald-600 text-slate-950 shadow-glow-emerald' 
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
              }`}
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
            </button>
          </div>
        </div>

        {/* Quick Launch & Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <a
            href={viewerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => Sounds.playClick()}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md text-center"
          >
            <span>🚀</span>
            <span>فتح المعاينة في تبويب جديد</span>
          </a>

          <button
            onClick={handleDownloadStandaloneHTML}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-white/10 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors hover:border-white/20"
          >
            <span>📄</span>
            <span>تحميل كملف HTML مستقل</span>
          </button>
        </div>

        {/* Hosting Base URL Settings (Accordion) */}
        <div className="border-t border-white/10 pt-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <span>⚙️</span>
              <span>إعدادات رابط الاستضافة (GitHub Pages)</span>
            </span>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              className={`transition-transform ${showSettings ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showSettings && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs space-y-2.5 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] text-slate-300 font-bold mb-1">
                  رابط صفحة المستعرض المنشور (Base Viewer URL):
                </label>
                <input
                  type="url"
                  value={customBaseUrl}
                  onChange={(e) => handleSaveBaseUrl(e.target.value)}
                  placeholder="https://username.github.io/repo-name/viewer.html"
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono outline-none focus:border-emerald-500 text-left"
                  dir="ltr"
                />
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                💡 <span className="text-emerald-300 font-bold">نصيحة:</span> عند رفع مستودعك على GitHub Pages، الصق رابط الـ <code className="text-emerald-300 font-mono">viewer.html</code> الخاص بك هنا لمرة واحدة فقط؛ وسيقوم البرنامج بتوليد جميع الروابط وأكواد الـ QR المستقبلية موجهة إليه تلقائياً!
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    const localUrl = `${window.location.origin}${window.location.pathname.replace(/\/index\.html$/i, '').replace(/\/+$/, '')}/viewer.html`;
                    handleSaveBaseUrl(localUrl);
                    Sounds.playClick();
                  }}
                  className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
                >
                  استعادة الرابط المحلي الافتراضي
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default ShareModal;
