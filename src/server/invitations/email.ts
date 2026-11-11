import 'server-only';
import { randomBytes } from 'node:crypto';
import { createTransport } from 'nodemailer';
const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export function invitationEmail(i: {
    email: string;
    name: string;
    inviter: string;
    role: string;
    link: string;
}) {
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(i.email))
        throw Error('invalid_email');
    const subject = '=?UTF-8?B?' + Buffer.from('دعوتك إلى فريق نور آب | Nour App team invitation').toString('base64') + '?=';
    const html = `<!doctype html><html lang="ar" dir="rtl"><body style="background:#eff4fa;font-family:Tahoma,Arial;color:#102e50"><div style="max-width:600px;margin:32px auto;background:white;border-radius:20px;overflow:hidden"><div style="background:#092545;padding:28px;color:white;font-size:26px;font-weight:bold">نور آب | NOUR APP</div><div style="padding:30px"><h1>مرحبًا ${esc(i.name)}</h1><p>دعاك <strong>${esc(i.inviter)}</strong> للانضمام إلى لوحة إدارة نور آب بدور <strong>${esc(i.role)}</strong>.</p><p>أنشئ كلمة المرور لتفعيل حسابك. الرابط صالح لمدة 24 ساعة ولمرة واحدة.</p><p style="margin:32px 0"><a href="${esc(i.link)}" style="background:#ffc400;color:#092545;padding:15px 28px;text-decoration:none;border-radius:10px;font-weight:bold">تفعيل حساب الموظف</a></p><p>Activate your Nour App staff account. This invitation expires in 24 hours and can only be used once.</p><p style="color:#65758a;font-size:13px">إذا لم تتوقع هذه الدعوة، تجاهلها أو تواصل مع support@nourappglobal.com.</p></div></div></body></html>`;
    const text = `Nour App | نور آب\nمرحبًا ${i.name}\nدعاك ${i.inviter} بدور ${i.role}.\nتفعيل حساب الموظف / Activate staff account:\n${i.link}\nصالح 24 ساعة ولمرة واحدة. Expires in 24 hours; single use.\nالدعم: support@nourappglobal.com`;
    const boundary = 'nour-' + randomBytes(16).toString('hex');
    const b64 = (s: string) => Buffer.from(s).toString('base64').match(/.{1,76}/g)!.join('\r\n');
    return ['From: Nour App <noreply@nourappglobal.com>', 'Reply-To: support@nourappglobal.com', `To: ${i.email}`, `Subject: ${subject}`, `Date: ${new Date().toUTCString()}`, `Message-ID: <${randomBytes(16).toString('hex')}@nourappglobal.com>`, 'MIME-Version: 1.0', 'Auto-Submitted: auto-generated', `Content-Type: multipart/alternative; boundary="${boundary}"`, '', `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64(text), `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64(html), `--${boundary}--`, ''].join('\r\n');
}
// Submit to the existing local SMTP service; require a verified TLS connection.
// A positive SMTP response proves queue acceptance, not inbox delivery.
export async function queueInvitationMail(message: string, email: string) {
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw Error('invalid_email');
    const transport = createTransport({ host: '127.0.0.1', port: 25, secure: false, requireTLS: true,
        name: 'nourappglobal.com', tls: { servername: 'mail.nourappglobal.com' },
        connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 15000,
        disableFileAccess: true, disableUrlAccess: true });
    try {
        const info = await transport.sendMail({ envelope: { from: 'noreply@nourappglobal.com', to: [email] }, raw: message });
        if (!info.accepted?.some(recipient => String(recipient).toLowerCase() === email.toLowerCase())) throw Error('mail_queue_failed');
    } finally { transport.close(); }
}
