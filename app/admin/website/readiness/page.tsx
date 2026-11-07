import Link from "next/link";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { redirect } from "next/navigation";
import { createClient } from "../../../../src/server/supabase/session";
import { partnerGuide } from "../../../../src/features/applications/partner-guide";
import sources from "../../../../docs/partner-guide-sources.json";
import { editingMap } from "../../../../src/features/website/editing-map";
import {
  launchCopy,
  launchState,
} from "../../../../src/core/config/launch-state";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "جاهزية الموقع | Site readiness",
  robots: { index: false, follow: false },
};
export default async function ReadinessPage() {
  const client = await createClient("admin");
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/admin/login");
  const access = await client.rpc("website_content_state");
  if (access.error)
    return (
      <p role="alert">
        لا تملك صلاحية عرض جاهزية المحتوى / Content readiness permission denied.
      </p>
    );
  const legal = await Promise.all(
    ["privacy-policy", "terms-and-conditions"].map(async (key) => {
      const r = await client.rpc("get_published_legal_page", { p_key: key });
      return {
        key,
        error: Boolean(r.error),
        published: Boolean(
          r.data?.length &&
            r.data[0].content_ar?.trim() &&
            r.data[0].content_en?.trim(),
        ),
        version: r.data?.[0]?.version,
      };
    }),
  );
  const files = await Promise.all(
    sources.map(async (source) => {
      try {
        const data = await readFile(
          join(process.cwd(), "public", source.path.replace(/^\//, "")),
        );
        return {
          ...source,
          size: data.length,
          verified:
            createHash("sha256").update(data).digest("hex") === source.sha256,
        };
      } catch {
        return { ...source, size: 0, verified: false };
      }
    }),
  );
  const mismatch = partnerGuide.ar.version !== partnerGuide.en.version;
  return (
    <main dir="rtl">
      <h1>
        جاهزية الموقع وإصدارات الدليل / Website readiness and guide releases
      </h1>
      <section className="aw-card">
        <h2>حالة التشغيل / Launch policy</h2>
        <p>
          {launchCopy.ar.bookingTitle} · {launchCopy.en.bookingTitle}
        </p>
        <p>
          {launchCopy.ar.appTitle} · {launchCopy.en.appTitle}
        </p>
        <p>
          {launchState.bookingEnabled ? "Booking enabled" : "Booking disabled"}{" "}
          · {launchState.appPublished ? "App published" : "App not published"}
        </p>
      </section>
      <section className="aw-card">
        <h2>المحتوى القانوني / Legal content</h2>
        {legal.map((row) => (
          <p key={row.key} role={row.published ? "status" : "alert"}>
            <strong>{row.key}</strong>:{" "}
            {row.error
              ? "تعذر التحقق / Verification failed"
              : row.published
                ? `منشور / Published · ${row.version}`
                : "لا توجد نسخة منشورة مكتملة باللغتين / No complete bilingual published version"}
          </p>
        ))}
        {legal.some((l) => !l.published) && (
          <p role="alert">
            جاهزية الإطلاق غير مكتملة. النماذج تحيل إلى السياسات؛ يلزم المحتوى
            المعتمد ونشره من إدارة المحتوى القانوني. لم يُنشأ نص بديل. / Launch
            readiness is incomplete until approved legal content is published.
          </p>
        )}
        <Link href="/admin/legal">
          إدارة المحتوى القانوني / Manage legal content
        </Link>
      </section>
      <section className="aw-card">
        <h2>دليل الشريك / Partner guide</h2>
        <p>
          الإصدار المرجعي العربي محفوظ: 1.1. لا تغيّر هذه الصفحة المتطلبات أو
          تعيد تسمية ملف بإصدار مختلف. / Arabic baseline 1.1 is retained; this
          page does not rewrite or relabel approved documents.
        </p>
        {mismatch && (
          <p role="alert">
            اختلاف إصدارات المصدر: العربية {partnerGuide.ar.version} والإنجليزية{" "}
            {partnerGuide.en.version}. يلزم مصدر معتمد متطابق قبل توحيد الإصدار؛
            الملفات الحالية تُعرض بأرقامها الفعلية. / Source release mismatch:
            obtain matched approved files before unifying versions.
          </p>
        )}
        {(["ar", "en"] as const).map((lang) => (
          <article key={lang}>
            <h3>
              {lang.toUpperCase()} · {partnerGuide[lang].version}
            </h3>
            <p>{partnerGuide[lang].updatedAt}</p>
            {files
              .filter((f) => f.path.includes("/" + lang + "/"))
              .map((file) => (
                <p key={file.path}>
                  <Link href={file.path}>
                    {file.path.endsWith(".pdf") ? "PDF" : "Word"}
                  </Link>{" "}
                  · {Math.ceil(file.size / 1024)}KB ·{" "}
                  {file.verified
                    ? "تطابق المصدر / Source verified"
                    : "فشل فحص الملف / File verification failed"}
                </p>
              ))}
          </article>
        ))}
        <Link href="/become-a-partner/guide">
          قراءة الدليل المعتمد / Read the approved guide
        </Link>
      </section>
      <section className="aw-card">
        <h2>خريطة التحرير / Editing map</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="aw-table">
            <thead>
              <tr>
                {[
                  "العنصر / Element",
                  "المصدر / Source",
                  "المحرر / Editor",
                  "الصلاحية / Permission",
                  "النشر / Publication",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {editingMap.map((row) => (
                <tr key={row[0]}>
                  <th>{row[0]}</th>
                  <td>{row[1]}</td>
                  <td>
                    <Link href={row[2]}>{row[2]}</Link>
                  </td>
                  <td>{row[3]}</td>
                  <td>{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
