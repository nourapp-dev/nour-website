"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "../../../src/lib/supabase/client";
import { getPublishedMessage } from "../../../src/features/settings/utils/public-content";

type Props = { language: "ar" | "en" };
type Value = {
  enabled?: boolean;
  name_ar?: string;
  name_en?: string;
  title_ar?: string;
  title_en?: string;
  message_ar?: string;
  message_en?: string;
  image_media_id?: string | null;
};

export default function CeoMessage({ language }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState<Value | null>(null);
  const [image, setImage] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.rpc("get_public_platform_settings");
      const row = (data || []).find((x: { setting_key: string }) => x.setting_key === "home.ceo_message");
      if (!row) return;
      const v = row.value_json as Value;
      setValue(v);
      if (v.image_media_id) {
        const { data: media } = await supabase.from("media").select("bucket,path").eq("id", v.image_media_id).maybeSingle();
        if (media) setImage(supabase.storage.from(media.bucket).getPublicUrl(media.path).data.publicUrl);
      }
    })();
  }, [supabase]);

  if (!value?.enabled) return null;

  const ar = language === "ar";
  const name = ar ? value.name_ar : value.name_en;
  const title = ar ? value.title_ar : value.title_en;
  const message = getPublishedMessage(ar ? value.message_ar : value.message_en);
  if (!message) return null;

  return (
    <section className="nr-ceo" dir={ar ? "rtl" : "ltr"}>
      <div className="nr-ceo-orb nr-ceo-orb-one" aria-hidden="true" />
      <div className="nr-ceo-orb nr-ceo-orb-two" aria-hidden="true" />

      <div className="nr-container nr-ceo-shell">
        <motion.div
          className="nr-ceo-photo-wrap"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
        >
          <div className="nr-ceo-photo">
            {image ? <img src={image} alt={name || title || "CEO"} /> : <div className="nr-ceo-placeholder">NourApp</div>}
          </div>
          <div className="nr-ceo-photo-caption">
            <strong>{name}</strong>
            <span>{title}</span>
          </div>
        </motion.div>

        <motion.div
          className="nr-ceo-copy"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ delay: 0.08 }}
        >
          <span className="nr-kicker">{ar ? "كلمة الرئيس التنفيذي" : "CEO MESSAGE"}</span>

          <div className="nr-ceo-quote-card">
            <span className="nr-ceo-quote-mark" aria-hidden="true">“</span>
            <blockquote>{message}</blockquote>
          </div>

          <div className="nr-ceo-signature">
            <span className="nr-ceo-signature-line" />
            <div>
              <strong>{name}</strong>
              <span>{title}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        .nr-ceo{position:relative;padding:112px 0;overflow:hidden;background:linear-gradient(145deg,var(--nr-soft) 0%,var(--nr-bg) 55%,color-mix(in srgb,var(--nr-blue) 5%,var(--nr-bg)) 100%)}
        .nr-ceo-orb{position:absolute;border-radius:50%;filter:blur(10px);pointer-events:none}.nr-ceo-orb-one{width:340px;height:340px;inset-inline-end:-120px;top:-120px;background:color-mix(in srgb,var(--nr-blue) 12%,transparent)}.nr-ceo-orb-two{width:260px;height:260px;inset-inline-start:-90px;bottom:-120px;background:color-mix(in srgb,var(--nr-gold) 14%,transparent)}
        .nr-ceo-shell{position:relative;z-index:1;display:grid;grid-template-columns:minmax(300px,.78fr) minmax(0,1.22fr);gap:76px;align-items:center}
        .nr-ceo-photo-wrap{position:relative}.nr-ceo-photo{position:relative;min-height:520px;border-radius:34px;overflow:hidden;background:linear-gradient(145deg,var(--nr-blue-dark),var(--nr-blue));box-shadow:0 32px 80px rgba(16,44,82,.2);border:1px solid color-mix(in srgb,var(--nr-text) 8%,transparent)}
        .nr-ceo-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(3,20,40,.18),transparent 42%);pointer-events:none}.nr-ceo-photo img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover}.nr-ceo-placeholder{min-height:520px;display:grid;place-items:center;color:white;font-size:34px;font-weight:900}
        .nr-ceo-photo-caption{position:absolute;inset-inline:24px;bottom:22px;z-index:2;padding:16px 18px;border-radius:18px;background:color-mix(in srgb,var(--nr-card) 88%,transparent);backdrop-filter:blur(14px);border:1px solid color-mix(in srgb,var(--nr-text) 8%,transparent);box-shadow:0 14px 34px rgba(0,0,0,.12);display:grid;gap:3px}.nr-ceo-photo-caption strong{font-size:18px;color:var(--nr-text)}.nr-ceo-photo-caption span{font-size:13px;color:var(--nr-blue);font-weight:800}
        .nr-ceo-copy>.nr-kicker{display:inline-flex;margin-bottom:24px}
        .nr-ceo-quote-card{position:relative;padding:30px 30px 30px 34px;border-radius:26px;background:var(--nr-card);border:1px solid var(--nr-border);box-shadow:var(--nr-shadow);overflow:hidden}.nr-ceo-quote-card::before{content:"";position:absolute;inset-inline-start:0;top:0;bottom:0;width:5px;background:var(--nr-gold)}
        .nr-ceo-quote-mark{position:absolute;inset-inline-end:22px;top:4px;font-family:Georgia,serif;font-size:92px;line-height:1;color:color-mix(in srgb,var(--nr-blue) 11%,transparent);pointer-events:none}.nr-ceo-copy blockquote{position:relative;z-index:1;margin:0;padding:0;font-size:clamp(18px,1.55vw,22px);line-height:2;color:var(--nr-muted);white-space:pre-line}
        .nr-ceo-signature{margin-top:30px;display:flex;align-items:center;gap:14px}.nr-ceo-signature-line{width:42px;height:3px;border-radius:999px;background:var(--nr-gold)}.nr-ceo-signature>div{display:grid;gap:4px}.nr-ceo-signature strong{font-size:20px;color:var(--nr-text)}.nr-ceo-signature span{color:var(--nr-blue);font-weight:800}
        html[data-theme="dark"] .nr-ceo-photo-caption{background:rgba(11,28,46,.88)}html[data-theme="dark"] .nr-ceo-quote-card{box-shadow:0 24px 60px rgba(0,0,0,.24)}
        @media(max-width:900px){.nr-ceo{padding:84px 0}.nr-ceo-shell{grid-template-columns:1fr;gap:42px}.nr-ceo-photo-wrap{max-width:620px;width:100%;margin-inline:auto}.nr-ceo-photo,.nr-ceo-placeholder{min-height:460px}}
        @media(max-width:560px){.nr-ceo{padding:70px 0}.nr-ceo-shell{gap:32px}.nr-ceo-photo,.nr-ceo-placeholder{min-height:380px;border-radius:24px}.nr-ceo-photo-caption{inset-inline:16px;bottom:16px}.nr-ceo-quote-card{padding:24px 22px 24px 28px}.nr-ceo-copy blockquote{font-size:17px;line-height:1.95}.nr-ceo-quote-mark{font-size:72px}}
      `}</style>
    </section>
  );
}
