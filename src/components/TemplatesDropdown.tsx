import React, { useState } from 'react';
import { useStore, type CustomTemplate } from '../store/useStore';
import { scoutingTemplates, type TemplateDefinition } from '../utils/templateBuilders';
import { Sounds } from '../utils/sound';

interface TemplatesDropdownProps {
  visible: boolean;
  onClose: () => void;
}

type CategoryType = 'الكل' | 'اساسي' | 'جسور' | 'خيام' | 'مطبخ' | 'ادوات' | 'مخصصة';

export const TemplatesDropdown: React.FC<TemplatesDropdownProps> = ({ visible, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('الكل');
  const [search, setSearch] = useState('');
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<'اساسي' | 'خيام' | 'جسور' | 'مطبخ' | 'ادوات'>('ادوات');
  const [savingSuccess, setSavingSuccess] = useState<string | null>(null);

  const buildTemplate = useStore(state => state.buildTemplate);
  const customTemplates = useStore(state => state.customTemplates || []);
  const saveCustomTemplate = useStore(state => state.saveCustomTemplate);
  const deleteCustomTemplate = useStore(state => state.deleteCustomTemplate);
  const selectedSpars = useStore(state => state.selectedSpars);

  const handleSelectBuiltin = (id: string) => {
    Sounds.playClick();
    buildTemplate(id, rotationDegrees);
    onClose();
  };

  const handleSelectCustom = (id: string) => {
    Sounds.playClick();
    buildTemplate(id, rotationDegrees);
    onClose();
  };

  const handleSaveSelectionAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newId = saveCustomTemplate(customName.trim(), `قالب مخصص تم إنشاؤه في ${new Date().toLocaleDateString('ar-EG')}`, customCategory);
    if (newId) {
      Sounds.playSnap();
      setSavingSuccess(`تم حفظ القالب "${customName.trim()}" بنجاح!`);
      setCustomName('');
      setActiveCategory('مخصصة');
      setTimeout(() => setSavingSuccess(null), 3000);
    }
  };

  const handleDeleteCustom = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف القالب المخصص "${name}"؟`)) {
      Sounds.playClick();
      deleteCustomTemplate(id);
    }
  };

  const categories = [
    { key: 'الكل', label: 'الكل', icon: '⛺', count: scoutingTemplates.length },
    { key: 'اساسي', label: 'أساسي وتأسيسي', icon: '📐', count: scoutingTemplates.filter(t => t.category === 'اساسي').length },
    { key: 'جسور', label: 'جسور وأبراج', icon: '🌉', count: scoutingTemplates.filter(t => t.category === 'جسور').length },
    { key: 'خيام', label: 'خيام وبوابات', icon: '🚪', count: scoutingTemplates.filter(t => t.category === 'خيام').length },
    { key: 'مطبخ', label: 'طاولات ومطبخ', icon: '🍽️', count: scoutingTemplates.filter(t => t.category === 'مطبخ').length },
    { key: 'ادوات', label: 'أدوات وأجهزة', icon: '🪑', count: scoutingTemplates.filter(t => t.category === 'ادوات').length },
    { key: 'مخصصة', label: 'قوالبي المخصصة', icon: '⭐', count: customTemplates.length }
  ] as const;

  const filteredBuiltin = scoutingTemplates.filter(t => {
    if (activeCategory === 'مخصصة') return false;
    const matchesCategory = activeCategory === 'الكل' || t.category === activeCategory;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredCustom = customTemplates.filter(t => {
    if (activeCategory !== 'الكل' && activeCategory !== 'مخصصة') return false;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const totalSparsInBOM = (mat: TemplateDefinition['materials']) => {
    return (mat.staves || 0) + (mat.medium || 0) + (mat.long || 0) + (mat.xlong || 0);
  };

  const getDifficultyBadge = (diff: 'مبتدئ' | 'متوسط' | 'متقدم') => {
    switch (diff) {
      case 'مبتدئ':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">سهل / مبتدئ</span>;
      case 'متوسط':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">متوسط الصعوبة</span>;
      case 'متقدم':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold">متقدم وهندسي</span>;
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      
      {/* Modal Container */}
      <div className="dcc-panel rounded-2xl shadow-card-elevated w-full max-w-5xl max-h-[90vh] flex flex-col slide-up overflow-hidden border border-editor-border text-txt-primary select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-editor-header border-b border-editor-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-xl shadow-glow-accent">
              📐
            </div>
            <div>
              <h3 className="text-base font-bold text-txt-primary flex items-center gap-2">
                مكتبة النماذج الهندسية الكشفية
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 font-mono">
                  {scoutingTemplates.length} نموذج رسمي
                </span>
                {customTemplates.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    +{customTemplates.length} مخصص
                  </span>
                )}
              </h3>
              <p className="text-xs text-txt-muted">نماذج كشفية هندسية مترابطة 100%، مستقرة فيزيائياً ومجهزة مع الحصر الكامل للأخشاب والحبال</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Rotation Pre-selector */}
            <div className="flex items-center gap-1.5 bg-editor-surface/80 px-2.5 py-1 rounded-xl border border-editor-border text-xs">
              <span className="text-txt-muted flex items-center gap-1 text-[11px] font-medium">
                🧭 زاوية التنزيل:
              </span>
              <div className="flex items-center gap-1">
                {([0, 90, 180, 270] as const).map(deg => (
                  <button
                    key={deg}
                    onClick={() => { Sounds.playClick(); setRotationDegrees(deg); }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                      rotationDegrees === deg
                        ? 'bg-accent text-white shadow-xs'
                        : 'text-txt-muted hover:text-txt-primary hover:bg-editor-hover'
                    }`}
                    title={`تدوير النموذج ${deg} درجة حول المحور الرأسي`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-lg hover:bg-editor-hover flex items-center justify-center text-txt-muted hover:text-txt-primary transition-colors text-sm"
              title="إغلاق [Esc]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Custom Template Save Banner (if spars selected) */}
        {selectedSpars.length > 0 && (
          <div className="px-6 py-2.5 bg-accent/10 border-b border-accent/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-accent font-semibold">
              <span>✨ لديك {selectedSpars.length} عصا محددة في أرض المخيم. يمكنك حفظ هذا التشكيل كقالب هندسي مخصص لإعادة استخدامه!</span>
            </div>
            <form onSubmit={handleSaveSelectionAsTemplate} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="اسم القالب المخصص..."
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="dcc-input text-xs py-1 px-2.5 rounded-lg w-44"
              />
              <select
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value as any)}
                className="dcc-input text-xs py-1 px-2 rounded-lg bg-editor-surface"
              >
                <option value="ادوات">أدوات</option>
                <option value="خيام">خيام وبوابات</option>
                <option value="مطبخ">مطبخ</option>
                <option value="جسور">جسور</option>
                <option value="اساسي">أساسي</option>
              </select>
              <button
                type="submit"
                disabled={!customName.trim()}
                className="dcc-btn text-xs font-bold py-1 px-3 bg-accent text-white rounded-lg disabled:opacity-50"
              >
                حفظ القالب
              </button>
            </form>
          </div>
        )}

        {savingSuccess && (
          <div className="px-6 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <span>✓</span>
            <span>{savingSuccess}</span>
          </div>
        )}

        {/* Search & Categories Bar */}
        <div className="p-3 sm:px-6 sm:py-3 border-b border-editor-border bg-editor-surface/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Categories Pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => { Sounds.playClick(); setActiveCategory(cat.key); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeCategory === cat.key
                    ? 'bg-accent text-white shadow-glow-accent'
                    : 'bg-editor-surface text-txt-muted hover:text-txt-primary hover:bg-editor-hover border border-editor-border/60'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeCategory === cat.key ? 'bg-white/20 text-white' : 'bg-editor-input text-txt-muted'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في أسماء وتفاصيل القوالب..."
              className="dcc-input w-full pr-8 text-xs py-1.5 rounded-xl"
            />
            <span className="absolute right-2.5 top-2 text-txt-muted text-xs pointer-events-none">
              🔍
            </span>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Custom Templates Section (when active or in 'الكل') */}
          {(activeCategory === 'مخصصة' || activeCategory === 'الكل') && filteredCustom.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-amber-400">
                <span>⭐ القوالب المخصصة المحفوظة</span>
                <div className="h-px flex-1 bg-amber-500/20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredCustom.map((t: CustomTemplate) => (
                  <div
                    key={t.id}
                    className="group relative flex flex-col justify-between p-4 rounded-xl border border-amber-500/30 bg-editor-surface/70 hover:bg-editor-surface hover:border-amber-400/60 transition-all shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm font-bold">
                            ⭐
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-txt-primary group-hover:text-amber-300 transition-colors">
                              {t.name}
                            </h5>
                            <span className="text-[10px] text-txt-muted font-mono">{t.createdAt}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCustom(t.id, t.name); }}
                          className="p-1 rounded-md text-txt-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="حذف القالب"
                        >
                          🗑️
                        </button>
                      </div>

                      <p className="text-[11px] text-txt-secondary mb-3 leading-relaxed">
                        {t.description || 'نموذج كشفي مخصص مصمم ومحفوظ محلياً.'}
                      </p>

                      {/* Specs Badge */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-txt-muted font-mono mb-3">
                        <span className="px-2 py-0.5 rounded-md bg-editor-input border border-editor-border text-txt-secondary">
                          🪵 {t.spars.length} عصا
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-editor-input border border-editor-border text-txt-secondary">
                          🪢 {t.lashings.length} ربطة
                        </span>
                        {t.stakes && t.stakes.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-editor-input border border-editor-border text-txt-secondary">
                            📍 {t.stakes.length} وتد
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectCustom(t.id)}
                      className="dcc-btn text-xs font-bold py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <span>بناء النموذج المخصص في المشهد</span>
                      {rotationDegrees > 0 && <span className="text-[10px] text-amber-400">({rotationDegrees}°)</span>}
                      <span>←</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If custom tab is empty */}
          {activeCategory === 'مخصصة' && filteredCustom.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl mx-auto mb-3 text-amber-400">
                ⭐
              </div>
              <h4 className="text-sm font-bold text-txt-primary mb-1">لا توجد قوالب مخصصة محفوظة بعد</h4>
              <p className="text-xs text-txt-muted max-w-md mx-auto leading-relaxed">
                لبناء قالب مخصص: حدد مجموعة من العصي في المشهد ثلاثي الأبعاد، ثم افتح نافذة القوالب واكتب اسماً في شريط الحفظ العلوي ليتم تسجيل نموذجك هنا فوراً!
              </p>
            </div>
          )}

          {/* Built-in Templates */}
          {activeCategory !== 'مخصصة' && (
            <>
              {filteredBuiltin.length === 0 && filteredCustom.length === 0 ? (
                <div className="text-center py-16 text-txt-muted text-xs">
                  لم يتم العثور على أي قوالب مطابقة للبحث
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                  {filteredBuiltin.map((t: TemplateDefinition) => {
                    const totalWood = totalSparsInBOM(t.materials);
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectBuiltin(t.id)}
                        className="group relative flex flex-col justify-between p-4 rounded-xl border border-editor-border/80 bg-editor-surface/60 hover:bg-editor-surface hover:border-accent/60 transition-all cursor-pointer shadow-xs hover:shadow-card-elevated"
                      >
                        <div>
                          {/* Top Row: Icon + Title + Badges */}
                          <div className="flex items-start gap-3.5 mb-2.5">
                            {/* Blueprint Graphic Thumbnail */}
                            <div 
                              className="w-14 h-14 bg-editor-input rounded-xl flex items-center justify-center p-2.5 border border-editor-border/80 text-cat-spar group-hover:text-accent group-hover:scale-105 transition-all shrink-0 shadow-inner [&_svg]:w-full [&_svg]:h-full"
                              dangerouslySetInnerHTML={{ __html: t.iconSvg }}
                            />
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h5 className="text-xs font-bold text-txt-primary group-hover:text-accent transition-colors truncate">
                                  {t.name}
                                </h5>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {getDifficultyBadge(t.difficulty)}
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-editor-input text-txt-muted border border-editor-border font-medium">
                                    {t.category}
                                  </span>
                                </div>
                              </div>
                              
                              <p className="text-[11px] text-txt-secondary leading-relaxed line-clamp-2">
                                {t.description}
                              </p>
                            </div>
                          </div>

                          {/* Technical Specifications Bar (Dimensions & Physical Integrity) */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 pb-2.5 border-t border-editor-border/50 text-[10px]">
                            <span className="px-2 py-0.5 rounded-md bg-accent/10 border border-accent/25 text-accent font-mono font-medium flex items-center gap-1">
                              <span>📐</span>
                              <span>{t.dimensions.width}م عرض × {t.dimensions.length}م طول × {t.dimensions.height}م ارتفاع</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-medium flex items-center gap-1">
                              <span>🛡️</span>
                              <span>100% مترابط فيزيائياً</span>
                            </span>
                          </div>

                          {/* Bill of Materials (BOM) Quick Breakdown */}
                          <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 bg-editor-input/60 rounded-lg border border-editor-border/60 text-[10px] font-mono text-txt-muted mb-3">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-txt-muted">الأخشاب المطلوبة:</span>
                              <span className="font-bold text-txt-primary">
                                🪵 {totalWood} قطعة
                              </span>
                              <span className="text-[9px] text-txt-secondary truncate">
                                {[
                                  t.materials.staves > 0 && `${t.materials.staves}×1.8م`,
                                  t.materials.medium > 0 && `${t.materials.medium}×2.7م`,
                                  t.materials.long > 0 && `${t.materials.long}×3.6م`,
                                  t.materials.xlong > 0 && `${t.materials.xlong}×4.8م`
                                ].filter(Boolean).join(', ')}
                              </span>
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[9px] text-txt-muted">الربطات الهندسية:</span>
                              <span className="font-bold text-txt-primary">
                                🪢 {t.materials.lashings} ربطة
                              </span>
                              <span className="text-[9px] text-txt-secondary">
                                محددة المواضع بدقة
                              </span>
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[9px] text-txt-muted">طول الحبال:</span>
                              <span className="font-bold text-txt-primary">
                                🧵 ~{t.materials.ropeLength} متر
                              </span>
                              <span className="text-[9px] text-txt-secondary">
                                {t.materials.stakes ? `+ ${t.materials.stakes} أوتاد تثبيت` : 'قائم بذاته'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Action Hint */}
                        <div className="flex items-center justify-between pt-2 border-t border-editor-border/40 text-[11px]">
                          <span className="text-txt-muted group-hover:text-txt-primary transition-colors text-[10px]">
                            انقر لبناء النموذج وتثبيته في موقع الدليل
                          </span>
                          <span className="font-bold text-accent group-hover:translate-x-[-3px] transition-transform flex items-center gap-1.5">
                            <span>بناء النموذج</span>
                            {rotationDegrees > 0 && <span className="text-[10px] text-accent/80 font-mono">({rotationDegrees}°)</span>}
                            <span>←</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-editor-header border-t border-editor-border flex flex-wrap items-center justify-between gap-2 text-xs text-txt-muted">
          <div className="flex items-center gap-3">
            <span>💡 نصيحة: انقر على أي نقطة دليل [P] في الأرض لتنزيل القالب في مكانها مباشرة وبزاوية الدوران المختارة.</span>
          </div>
          <button
            onClick={onClose}
            className="dcc-btn text-xs font-semibold py-1.5 px-5 rounded-lg"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatesDropdown;

