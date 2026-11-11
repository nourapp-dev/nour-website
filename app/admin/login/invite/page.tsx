"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
type Preview = {
    name: string;
    email: string;
    inviter: string;
    role: string;
    expiresAt: string;
};
export default function AdminInvitePage() {
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
    return <main className="staff-activation" dir="rtl"><section><header><strong>نور آب <span dir="ltr">NOUR APP</span></strong><p>دعوة الانضمام إلى فريق العمل</p></header><div className="activation-body">
 {!ready ? <p role="status">جارٍ التحقق من الدعوة…</p> : done ? <><h1>تم تفعيل حسابك</h1><p>يمكنك الآن تسجيل الدخول إلى لوحة نور آب بصلاحيات الدور المحدد.</p><Link href="/admin/login?invited=1">تسجيل الدخول</Link></> : <><h1>مرحبًا {preview?.name ?? 'بك'}</h1>{preview && <><p>دعاك <strong>{preview.inviter}</strong> للانضمام بدور <strong>{preview.role}</strong>.</p><p dir="ltr">{preview.email}</p><p>تنتهي الدعوة: {new Date(preview.expiresAt).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })} بتوقيت الرياض.</p></>}{error && <p role="alert" className="activation-error">{error}</p>}{preview && <form onSubmit={accept}><label>كلمة المرور الجديدة<input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy}/></label><label>تأكيد كلمة المرور<input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy}/></label><p>12 حرفًا على الأقل. الدعوة صالحة لمدة 24 ساعة ولمرة واحدة.</p><button disabled={busy}>{busy ? 'جارٍ التفعيل…' : 'تفعيل حساب الموظف'}</button></form>}</>}
 </div></section><style jsx>{`.staff-activation{min-height:100vh;display:grid;place-items:center;padding:24px;background:#071c34;color:#132e4d}.staff-activation section{width:min(100%,500px);border-radius:22px;background:#fff;overflow:hidden;box-shadow:0 24px 80px #0003}.staff-activation header{background:#0b2e54;padding:28px;color:white}.staff-activation header strong{font-size:25px}.staff-activation header span{float:left}.activation-body{padding:28px}.activation-body h1{font-size:25px}.activation-body p{line-height:1.8}.activation-body form,.activation-body label{display:grid;gap:10px}.activation-body form{gap:18px}.activation-body input{padding:13px;border:1px solid #bdccdc;border-radius:10px;color:#132e4d;background:white;font:inherit}.activation-body button,.activation-body a{display:block;padding:14px;border:0;border-radius:10px;background:#ffc400;color:#102e50;font:inherit;font-weight:bold;text-align:center}.activation-error{background:#fff1f1;color:#a21a26;padding:12px;border-radius:8px}`}</style></main>;
}
