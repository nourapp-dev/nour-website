"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
type Preview = {
    name: string;
    email: string;
    inviter: string;
    role: string;
    expiresAt: string;
};
export default function AdminInvitePage() {
    const [showPassword, setShowPassword] = useState(false);
    const tokenRef = useRef<string | null>(null);
    const [token, setToken] = useState(''), [preview, setPreview] = useState<Preview | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [ready, setReady] = useState(false), [done, setDone] = useState(false), [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState('');
    useEffect(() => {
        const value = tokenRef.current ?? (tokenRef.current = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '');
        // Fragment tokens never enter HTTP access logs or referral headers.
        window.history.replaceState(null, '', window.location.pathname);
        setToken(value);
        if (!value) {
            setError('هذه دعوة قديمة أو غير صالحة. اطلب من المسؤول إعادة إرسالها من تبويب الدعوات.');
            setReady(true);
            return;
        }
        const controller = new AbortController();
        fetch('/api/admin-invitations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'preview', token: value }), signal: controller.signal }).then(async (r) => { const data = await r.json(); if (!r.ok)
            throw Error(data.message); setPreview(data.invitation); }).catch(e => { if (e.name !== 'AbortError')
            setError(e.message); }).finally(() => { if (!controller.signal.aborted)
            setReady(true); });
        return () => controller.abort();
    }, []);
    async function accept(e: React.FormEvent) {
        e.preventDefault();
        if (busy || !preview)
            return;
        if (password !== confirmation) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            const r = await fetch('/api/admin-invitations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accept', token, password }) });
            const data = await r.json();
            if (!r.ok)
                throw Error(data.message);
            setDone(true);
            setPassword('');
            setConfirmation('');
            setToken('');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'تعذر التفعيل. أعد المحاولة.');
        }
        finally {
            setBusy(false);
        }
    }
    return <main className="staff-activation" dir="rtl"><section aria-labelledby="activation-title">
        <header><Image src="/images/brand/nour-horizontal.svg" width={224} height={76} alt="نور آب | NOUR APP" priority /><p>دعوة الانضمام إلى فريق العمل</p></header>
        <div className="activation-body">
            {!ready ? <p role="status">جارٍ التحقق من دعوتك…</p> : done ? <><span className="step-label">أهلًا بك في الفريق</span><h1 id="activation-title">تم تفعيل حسابك بنجاح</h1><p>حسابك جاهز. سجّل الدخول للبدء في لوحة نور آب بصلاحيات دورك الوظيفي.</p><Link className="primary-action" href="/admin/login?invited=1">الانتقال إلى تسجيل الدخول</Link></> : <>
                <span className="step-label">خطوتك الأولى مع نور آب</span><h1 id="activation-title">{preview ? <>مرحبًا <bdi>{preview.name}</bdi>،</> : 'أهلًا بك في نور آب'}</h1>
                {preview && <><p className="intro">دعاك <bdi><strong>{preview.inviter}</strong></bdi> للانضمام إلى فريق العمل.</p><dl className="invitation-details"><div><dt>الدور الوظيفي</dt><dd><bdi>{preview.role}</bdi></dd></div><div><dt>بريد حسابك</dt><dd className="email-address"><bdi dir="ltr">{preview.email}</bdi></dd></div></dl><p className="expiry">تنتهي صلاحية الدعوة في <time dateTime={preview.expiresAt}>{new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {timeZone: 'Asia/Riyadh', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit'}).format(new Date(preview.expiresAt))}</time> <span>(بتوقيت الرياض)</span></p></>}
                {error && <p role="alert" className="activation-error">{error}</p>}
                {preview && <form onSubmit={accept}><div className="form-heading"><h2>أنشئ كلمة المرور</h2><button className="visibility-toggle" type="button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}</button></div><label htmlFor="staff-password">كلمة المرور الجديدة<input id="staff-password" aria-describedby="password-help" type={showPassword ? 'text' : 'password'} autoComplete="new-password" dir="ltr" minLength={12} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy}/></label><label htmlFor="staff-password-confirm">تأكيد كلمة المرور<input id="staff-password-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" dir="ltr" minLength={12} maxLength={128} required value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy}/></label><p id="password-help" className="password-help">استخدم 12 حرفًا على الأقل. اختر كلمة مرور خاصة بهذا الحساب.</p><button className="primary-action" disabled={busy}>{busy ? 'جارٍ تفعيل حسابك…' : 'تفعيل حسابي والانضمام للفريق'}</button><p className="security-note">دعوة شخصية · صالحة لمدة 24 ساعة · تُستخدم مرة واحدة</p></form>}
            </>}
        </div><footer>تحتاج إلى مساعدة؟ <a href="mailto:support@nourappglobal.com">تواصل مع الدعم</a></footer>
    </section><p className="brand-caption">نور آب · كل ما تحتاجه لرحلة عمرة ميسّرة</p><style jsx>{`
        .staff-activation{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 16px;background:radial-gradient(ellipse at top,#173f67,#071c34 70%);color:#132e4d;font-family:Tahoma,Arial,sans-serif}
        .staff-activation section{width:min(100%,520px);border:1px solid #dce6f0;border-radius:22px;background:#fff;overflow:hidden;box-shadow:0 24px 80px #0003}
        .staff-activation header{background:#fff;padding:28px 24px 20px;border-bottom:4px solid #ffc400;display:flex;flex-direction:column;align-items:center;gap:12px}
        .staff-activation header p{margin:0;color:#55708b;font-size:14px}.activation-body{padding:28px}.step-label{color:#55708b;font-size:12px}.activation-body h1{font-size:25px;line-height:1.6;margin:8px 0 12px;overflow-wrap:anywhere}.activation-body p{line-height:1.85}.intro{font-size:15px}.invitation-details{margin:20px 0 12px;padding:16px;background:#f3f7fc;border:1px solid #e0e9f3;border-radius:12px;display:grid;gap:14px}.invitation-details dt{font-size:12px;color:#55708b;margin-bottom:4px}.invitation-details dd{margin:0;font-size:15px;font-weight:bold;line-height:1.6;overflow-wrap:anywhere}.invitation-details .email-address{font-weight:normal}.expiry{font-size:12px;color:#55708b;margin:12px 0 24px}.expiry span{white-space:nowrap}.activation-body form,.activation-body label{display:grid;gap:8px}.activation-body label{font-size:14px}.activation-body form{gap:18px}.form-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.form-heading h2{font-size:16px;margin:0}.visibility-toggle{background:transparent;color:#0868e8;font:inherit;font-size:12px;border:0;cursor:pointer;padding:8px 0}.activation-body input{width:100%;min-width:0;box-sizing:border-box;padding:13px;border:1px solid #bdccdc;border-radius:10px;color:#132e4d;background:white;font:inherit;font-size:16px;min-height:48px}.activation-body input:focus-visible,.activation-body button:focus-visible{outline:3px solid #0868e8;outline-offset:3px}.activation-body :global(.primary-action){display:block;width:100%;box-sizing:border-box;padding:16px 12px;border:0;border-radius:12px;background:#ffc400;color:#102e50;font:inherit;font-size:16px;font-weight:bold;text-align:center;text-decoration:none;cursor:pointer}.activation-body button:disabled{opacity:.65;cursor:wait}.activation-body .password-help{font-size:12px;color:#55708b;margin:-8px 0 0}.activation-body .security-note{font-size:11px;text-align:center;color:#55708b;margin:0}.activation-error{background:#fff1f1;color:#a21a26;padding:12px;border:1px solid #ffd4d4;border-radius:8px;font-size:14px;overflow-wrap:anywhere}.staff-activation footer{padding:18px 24px;border-top:1px solid #e0e9f3;background:#f8fafc;text-align:center;color:#55708b;font-size:12px}.staff-activation footer a{color:#0868e8;text-decoration:underline}.brand-caption{color:#b4c8dc;font-size:11px;text-align:center;margin:20px 0 0}@media(max-width:400px){.staff-activation{padding:20px 12px}.activation-body{padding:22px 20px}.activation-body h1{font-size:23px}}
    `}</style></main>;
}
