"use client";
import { useState } from "react";

export default function PreviewControls() {
  const [width, setWidth] = useState(390);
  const [language, setLanguage] = useState("ar");
  const [path, setPath] = useState("/");
  const [revision, setRevision] = useState(0);
  const [scenario, setScenario] = useState("success");
  const [error, setError] = useState("");
  const src = path + "?lang=" + language;
  async function applyScenario(value: string) {
    try {
      const response = await fetch("http://127.0.0.1:54322/__scenario?value=" + value, { method: "POST" });
      if (!response.ok) throw new Error("Preview service unavailable");
      setScenario(value); setError(""); setRevision(current => current + 1);
    } catch { setError("تعذر تغيير الحالة. شغّل scripts/ui-preview.mjs — Preview service unavailable."); }
  }
  return <main className="preview-review" dir="rtl">
    <header><h1>فحص واجهة نور آب · Local UI review</h1><p>مقارنة محلية قبل/بعد. نسخة «قبل» تحفظ التصميم المرفوض فقط؛ إجراءات التطبيق فيها أيضًا غير مفعّلة. بيانات عرض ثابتة ومعزولة. تغيير الحالة يؤثر في جميع نوافذ هذه المعاينة فقط. لا يثبت هذا نجاح الفحص البصري أو فتح التطبيق على جهاز فعلي.</p>
      <div className="preview-controls">
        <label>العرض / Width<select value={width} onChange={event => setWidth(Number(event.target.value))}>{[390, 768, 1440].map(value => <option key={value} value={value}>{value}px</option>)}</select></label>
        <label>اللغة / Language<select value={language} onChange={event => setLanguage(event.target.value)}><option value="ar">العربية RTL</option><option value="en">English LTR</option></select></label>
        <label>الصفحة / Page<select value={path} onChange={event => setPath(event.target.value)}><option value="/">بعد: الرئيسية الأصلية / After: restored home</option><option value="/ui-preview/before">قبل: تصميم الدفعة الثانية / Before: batch 2</option><option value="/programs">البرامج / Programs</option><option value="/programs/demo-umrah-3">تفاصيل البرنامج / Details</option><option value="/programs/missing-demo">برنامج غير متاح / Unavailable</option><option value="/get-app">التطبيق / App options</option><option value="/open-app">بديل الفتح / Open fallback</option></select></label>
        <label>الحالة / Scenario<select value={scenario} onChange={event => void applyScenario(event.target.value)}><option value="success">نجاح / Success</option><option value="loading">تحميل بطيء / Slow loading</option><option value="error">خطأ البرامج / Catalog error</option><option value="empty">لا برامج / Empty</option><option value="secondary-error">تعطل النقل والتأشيرات / Secondary errors</option></select></label>
        <button onClick={() => setRevision(current => current + 1)}>إعادة التحميل / Reload</button><a href={src} target="_blank" rel="noopener noreferrer">فتح الصفحة / Open page</a>
      </div>{error && <p role="alert">{error}</p>}
    </header>
    <div className="preview-canvas"><iframe key={src + revision} src={src} title={"Nour UI " + width + "px " + language} width={width} height={900} /></div>
    <style jsx>{`
      .preview-review { background: #edf3fa; color: #173557; min-height: 100vh; padding: 20px; }
      header { max-width: 1400px; margin: auto; } h1 { font-size: 26px; } p { line-height: 1.8; }
      .preview-controls { display: flex; flex-wrap: wrap; gap: 16px; align-items: end; }
      label { display: grid; gap: 6px; } select, button, a { min-height: 44px; padding: 10px; font: inherit; border: 1px solid #b6c9e0; border-radius: 8px; color: #173557; background: #fff; }
      .preview-canvas { overflow: auto; padding: 24px 0; direction: ltr; }
      iframe { display: block; max-width: none; border: 1px solid #b6c9e0; background: #fff; margin: auto; }
    `}</style>
  </main>;
}
