import React, { useState } from 'react';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ visible, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!visible) return null;

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem('pioneering_help_seen', 'true');
    }
    onClose();
  };

  const shortcutsList = [
    { keys: ['W', 'T'], label: 'أداة التحريك في الفضاء' },
    { keys: ['E', 'R'], label: 'أداة التدوير والزوايا' },
    { keys: ['Q'], label: 'تحديد مستطيل' },
    { keys: ['F'], label: 'تحديد حر (Lasso)' },
    { keys: ['B'], label: 'إنزال الخشبة للسطح مباشرة' },
    { keys: ['Space'], label: 'تأكيد عقد الربطة عند التقاطع' },
    { keys: ['S'], label: 'تبديل الانجذاب الكشفي الذكي (خلوص 7 سم)' },
    { keys: ['Alt'], label: 'الضغط المطول لتجاوز الانجذاب والتحريك الحر' },
    { keys: ['K'], label: 'إضافة وتد أرضي جديد' },
    { keys: ['P'], label: 'إضافة نقطة دليل مرجعية' },
    { keys: ['L'], label: 'إضافة خط قياس هندسي' },
    { keys: ['G'], label: 'تبديل عرض حدود موقع البناء' },
    { keys: ['Shift', 'D'], label: 'تكرار ومضاعفة المحدد (أو حرف D)' },
    { keys: ['Ctrl', 'A'], label: 'تحديد كافة عناصر المشهد' },
    { keys: ['Ctrl', 'Z'], label: 'تراجع عن آخر عملية' },
    { keys: ['Ctrl', 'Y'], label: 'إعادة العملية الملغاة' },
    { keys: ['Del'], label: 'حذف العنصر المحدد' },
    { keys: ['Esc'], label: 'إلغاء التحديد وتصفير الأدوات' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      
      {/* Modal Container */}
      <div className="dcc-panel rounded-2xl max-w-2xl w-full shadow-card-elevated border border-editor-border text-txt-primary select-none slide-up flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-editor-header border-b border-editor-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-xl">
              ⛺
            </div>
            <div>
              <h3 className="text-base font-bold text-txt-primary">دليل استخدام محاكي البناء الكشفي 2.0</h3>
              <p className="text-xs text-txt-muted">نصائح سريعة للتحكم بالكاميرا، البناء، وعقد الحبال الهندسية</p>
            </div>
          </div>
          <button 
            onClick={handleFinish} 
            className="w-8 h-8 rounded-lg hover:bg-editor-hover flex items-center justify-center text-txt-muted hover:text-txt-primary transition-colors text-sm"
            title="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Card 1: Camera controls */}
          <div className="bg-editor-surface/70 p-4 rounded-xl border border-editor-border/60">
            <h4 className="text-xs font-bold text-accent mb-2.5 flex items-center gap-2">
              <span>🎥</span> التحكم في كاميرا المشهد ثلاثي الأبعاد:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-txt-secondary">
              <div className="flex items-center gap-2 bg-editor-input/60 p-2.5 rounded-lg border border-editor-border/40">
                <span className="text-accent font-bold">الزر الأيسر + السحب:</span>
                <span>تدوير زاوية الرؤية</span>
              </div>
              <div className="flex items-center gap-2 bg-editor-input/60 p-2.5 rounded-lg border border-editor-border/40">
                <span className="text-accent font-bold">الزر الأيمن + السحب:</span>
                <span>إزاحة الكاميرا (Pan)</span>
              </div>
              <div className="flex items-center gap-2 bg-editor-input/60 p-2.5 rounded-lg border border-editor-border/40">
                <span className="text-accent font-bold">عجلة الفأرة:</span>
                <span>تكبير وتصغير (Zoom)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Building & Lashing principles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-editor-surface/70 p-4 rounded-xl border border-editor-border/60">
              <h4 className="text-xs font-bold text-cat-spar mb-2 flex items-center gap-1.5">
                <span>🪵</span> إنشاء وتحريك الأخشاب:
              </h4>
              <ul className="text-xs text-txt-secondary space-y-1.5 leading-relaxed">
                <li>• اختر نوع الخشب من لوحة الأدوات (عصا 1م، متوسط 3م، طويل 4م، سارية 5م).</li>
                <li>• انقر على الخشبة لتظهر مقابض التحريك (Gizmo).</li>
                <li>• اضغط <kbd className="px-1 py-0.5 bg-editor-input border rounded font-mono text-[10px]">W</kbd> للتحريك، أو <kbd className="px-1 py-0.5 bg-editor-input border rounded font-mono text-[10px]">E</kbd> لتدوير الزاوية.</li>
              </ul>
            </div>

            <div className="bg-editor-surface/70 p-4 rounded-xl border border-editor-border/60">
              <h4 className="text-xs font-bold text-cat-lashing mb-2 flex items-center gap-1.5">
                <span>🪢</span> الربط التلقائي والترابط:
              </h4>
              <ul className="text-xs text-txt-secondary space-y-1.5 leading-relaxed">
                <li>• قرب خشبتين من بعضهما، وسيتعرف النظام فوراً على الزاوية.</li>
                <li>• اضغط <kbd className="px-1 py-0.5 bg-editor-input border rounded font-mono text-[10px]">مسافة</kbd> أو زر "ربط الآن" لتثبيت العقدة.</li>
                <li>• بعد الربط، يتحرك الخشب المتصل ككتلة واحدة صلبة!</li>
              </ul>
            </div>
          </div>

          {/* Card 3: Shortcuts Grid */}
          <div className="bg-editor-surface/70 p-4 rounded-xl border border-editor-border/60">
            <h4 className="text-xs font-bold text-txt-primary mb-3 flex items-center gap-2">
              <span>⌨️</span> أهم اختصارات لوحة المفاتيح:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {shortcutsList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-editor-input/70 border border-editor-border/50">
                  <span className="text-txt-secondary">{item.label}</span>
                  <div className="flex gap-1" dir="ltr">
                    {item.keys.map((k, kIdx) => (
                      <kbd key={kIdx} className="px-2 py-0.5 rounded bg-editor-hover border border-editor-border text-txt-primary font-mono text-[11px] font-bold shadow-xs">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-editor-header border-t border-editor-border flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-txt-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>عدم فتح هذا الدليل تلقائياً في المرات القادمة</span>
          </label>

          <button
            onClick={handleFinish}
            className="dcc-btn text-xs font-bold py-2 px-6 bg-gradient-to-r from-accent to-wood-600 hover:from-accent-hover hover:to-wood-500 text-white rounded-xl shadow-glow-accent transition-all"
          >
            بدء البناء والمحاكاة 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
