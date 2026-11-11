import 'server-only';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
    const subject = '=?UTF-8?B?' + Buffer.from('دعوة فريق نور آب | Nour App').toString('base64') + '?=';
    const html = invitationEmailHtml(i);
    const text = `Nour App | نور آب\nدعوة الانضمام إلى فريق العمل\nمرحبًا ${i.name}،\nدعاك ${i.inviter} للانضمام إلى لوحة نور آب.\nدورك الوظيفي: ${i.role}\nأنشئ كلمة مرور خاصة بك لتفعيل الحساب والبدء.\nتفعيل حساب الموظف / Activate staff account:\n${i.link}\nالرابط صالح لمدة 24 ساعة من إرسال الدعوة ولمرة واحدة. لا تشارك الرابط مع الآخرين.\nExpires in 24 hours; single use.\nإذا لم تتوقع الدعوة، يمكنك تجاهلها.\nالدعم: support@nourappglobal.com`;
    const boundary = 'nour-' + randomBytes(16).toString('hex');
    const b64 = (s: string) => Buffer.from(s).toString('base64').match(/.{1,76}/g)!.join('\r\n');
    const related = boundary + '-related';
    const logo = readFileSync(join(process.cwd(), 'public/images/brand/nour-email-logo.png')).toString('base64').match(/.{1,76}/g)!.join('\r\n');
    return ['From: Nour App <noreply@nourappglobal.com>', 'Reply-To: support@nourappglobal.com', `To: ${i.email}`, `Subject: ${subject}`, `Date: ${new Date().toUTCString()}`, `Message-ID: <${randomBytes(16).toString('hex')}@nourappglobal.com>`, 'MIME-Version: 1.0', 'Auto-Submitted: auto-generated', `Content-Type: multipart/related; boundary="${related}"`, '', `--${related}`, `Content-Type: multipart/alternative; boundary="${boundary}"`, '', `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64(text), `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64(html), `--${boundary}--`, '', `--${related}`, 'Content-Type: image/png; name="nour-logo.png"', 'Content-Transfer-Encoding: base64', 'Content-ID: <nour-logo>', 'Content-Disposition: inline; filename="nour-logo.png"', '', logo, `--${related}--`, ''].join('\r\n');
}
// Table layout and inline styles work in Gmail, Apple Mail and Outlook.
export function invitationEmailHtml(i: {name: string; inviter: string; role: string; link: string}) {
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>دعوة فريق نور آب</title></head><body style="margin:0;padding:0;background:#eff4fa;color:#102e50;font-family:Tahoma,Arial,sans-serif;text-align:right;direction:rtl"><div style="display:none;max-height:0;overflow:hidden;opacity:0">دعوتك للانضمام إلى فريق نور آب جاهزة. فعّل حسابك خلال 24 ساعة.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff4fa"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #dce6f0;border-radius:20px;overflow:hidden">
<tr><td align="center" style="padding:32px 24px 24px;background:#fff;border-bottom:4px solid #ffc400"><img src="cid:nour-logo" width="224" alt="نور آب | NOUR APP" style="display:block;width:224px;max-width:100%;height:auto;border:0"></td></tr>
<tr><td style="padding:28px 24px 8px"><p style="margin:0 0 12px;color:#55708b;font-size:13px;letter-spacing:1px">فريق نور آب</p><h1 style="margin:0 0 16px;font-size:26px;line-height:1.5;color:#0b2e54">مرحبًا <bdi>${esc(i.name)}</bdi>،</h1><p style="margin:0;font-size:16px;line-height:1.9">يسعدنا انضمامك إلى فريق العمل. دعاك <bdi style="font-weight:bold">${esc(i.inviter)}</bdi> للوصول إلى لوحة إدارة نور آب.</p></td></tr>
<tr><td style="padding:16px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f7fc;border:1px solid #e0e9f3;border-radius:12px"><tr><td style="padding:18px;font-size:14px;line-height:1.8;color:#55708b">دورك الوظيفي<br><strong style="font-size:18px;color:#102e50"><bdi>${esc(i.role)}</bdi></strong></td></tr></table></td></tr>
<tr><td style="padding:4px 24px 24px"><p style="margin:0 0 20px;font-size:16px;line-height:1.9">للبدء، أنشئ كلمة مرور خاصة بك وفعّل حسابك.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#ffc400" style="border-radius:12px"><a href="${esc(i.link)}" style="display:block;padding:17px 12px;color:#102e50;font-size:17px;font-weight:bold;text-decoration:none;line-height:1.5">تفعيل حسابي والانضمام للفريق</a></td></tr></table><p style="margin:16px 0 0;font-size:13px;line-height:1.9;color:#55708b">الرابط صالح لمدة <strong>24 ساعة</strong> من إرسال الدعوة، ويُستخدم مرة واحدة فقط. لا تشاركه مع الآخرين.</p></td></tr>
<tr><td style="padding:20px 24px;background:#f8fafc;border-top:1px solid #e0e9f3"><p lang="en" dir="ltr" style="margin:0 0 16px;text-align:left;font-family:Arial,sans-serif;font-size:13px;line-height:1.7;color:#55708b">You’re invited to the Nour App team. Create your password to activate your account. This invitation expires in 24 hours and can only be used once.</p><p style="margin:0;font-size:13px;line-height:1.9;color:#55708b">إذا لم تتوقع هذه الدعوة، يمكنك تجاهلها. للمساعدة:<br><a href="mailto:support@nourappglobal.com" dir="ltr" style="color:#0868e8;word-break:break-all">support@nourappglobal.com</a></p></td></tr></table><p style="margin:16px 0 0;font-size:12px;color:#65758a">نور آب · كل ما تحتاجه لرحلة عمرة ميسّرة</p></td></tr></table></body></html>`;
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
