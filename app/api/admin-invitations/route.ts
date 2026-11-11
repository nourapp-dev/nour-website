import { createAdminClient } from '../../../src/server/supabase/admin';
import { digestToken, smallBody, reply, check } from '../../../src/server/invitations/manage';
export const runtime = 'nodejs';
export async function POST(request: Request) {
    let claimed: string | null = null;
    const admin = createAdminClient();
    try {
        if (request.headers.get('origin') && request.headers.get('origin') !== new URL(process.env.NEXT_PUBLIC_SITE_URL!).origin)
            return reply({ message: 'طلب غير صالح.' }, 403);
        const body = await smallBody(request);
        if (typeof body.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(body.token))
            return reply({ message: 'الدعوة غير صالحة أو قديمة. اطلب إعادة إرسالها من المسؤول.' }, 400);
        const digest = digestToken(body.token);
        if (body.action === 'preview') {
            const r = await admin.from('employee_invitations').select('email,full_name,invited_by_name,role_id,expires_at,status,sent_at').eq('token_hash', digest).eq('status', 'pending').gt('expires_at', new Date().toISOString()).not('sent_at', 'is', null).maybeSingle();
            check(r.error);
            if (!r.data)
                return reply({ message: 'انتهت صلاحية الدعوة أو أُلغيت أو استُخدمت. اطلب رابطًا جديدًا.' }, 410);
            const role = await admin.from('roles').select('name_ar,name_en').eq('id', r.data.role_id).eq('is_active', true).is('deleted_at', null).single();
            check(role.error);
            if (!role.data)
                throw Error('invitation_unavailable');
            return reply({ invitation: { email: r.data.email, name: r.data.full_name, inviter: r.data.invited_by_name, expiresAt: r.data.expires_at, role: role.data.name_ar } });
        }
        if (body.action !== 'accept' || typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128)
            return reply({ message: 'استخدم كلمة مرور من 12 إلى 128 حرفًا.' }, 400);
        const r = await admin.rpc('employee_invitation_claim', { digest });
        check(r.error);
        claimed = digest;
        const row = Array.isArray(r.data) ? r.data[0] : r.data;
        if (!row) throw Error('invitation_unavailable');
        // Only pre-created, never-activated administrative accounts may be activated.
        const profile = await admin.from('admin_profiles').select('status,deleted_at,last_login_at').eq('id', row.target_user_id).single();
        check(profile.error);
        if (!profile.data || profile.data.status !== 'invited' || profile.data.deleted_at || profile.data.last_login_at)
            throw Error('account_already_active');
        const identity = await admin.auth.admin.getUserById(row.target_user_id);
        check(identity.error);
        if (identity.data.user?.email?.toLowerCase() !== row.email) throw Error('invitation_user_mismatch');
        const account = await admin.auth.admin.updateUserById(row.target_user_id, { password: body.password, email_confirm: true });
        check(account.error);
        const completed = await admin.rpc('employee_invitation_complete', { digest, target_user: row.target_user_id });
        check(completed.error);
        claimed = null;
        return reply({ message: 'تم تفعيل حسابك. سجل الدخول إلى لوحة نور آب.' });
    }
    catch {
        if (claimed)
            await admin.from('employee_invitations').update({ status: 'pending' }).eq('token_hash', claimed).eq('status', 'processing');
        return reply({ message: 'تعذر تفعيل الدعوة. قد تكون منتهية أو أُلغيت أو استُخدمت. اطلب إعادة الإرسال من المسؤول.' }, 400);
    }
}
