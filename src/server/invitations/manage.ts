import 'server-only';
import { randomBytes, createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '../supabase/session';
import { createAdminClient } from '../supabase/admin';
import { canAccessAdmin } from '../../features/auth/services/account-access';
import { validInvitationInput, type EmployeeInvitation, type InvitationRole } from '../../features/users/invitations';
import { invitationEmail, queueInvitationMail } from './email';
export const digestToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
export const check = (error: {
    message: string;
} | null) => { if (error)
    throw Error(error.message); };
export async function smallBody(request: Request) {
    if (Number(request.headers.get('content-length') ?? 0) > 4096)
        throw Error('body_too_large');
    const reader = request.body?.getReader();
    if (!reader)
        throw Error('invalid_request');
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
        const part = await reader.read();
        if (part.done)
            break;
        size += part.value.length;
        if (size > 4096) {
            await reader.cancel();
            throw Error('body_too_large');
        }
        chunks.push(part.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function invitationManager(request?: Request) {
    const client = await createClient('admin');
    const { data, error } = await client.auth.getUser();
    if (error || !data.user || !(await canAccessAdmin(client, data.user.id)))
        throw Error('unauthorized');
    const allowed = await client.rpc('current_user_has_permission', { permission_code: 'users.manage' });
    if (allowed.error || allowed.data !== true)
        throw Error('forbidden');
    if (request?.headers.get('origin') && request.headers.get('origin') !== new URL(process.env.NEXT_PUBLIC_SITE_URL!).origin)
        throw Error('forbidden');
    return { admin: createAdminClient(), actor: data.user.id };
}
export function invitationError(error: unknown) {
    const code = error instanceof Error ? error.message : 'invitation_failed';
    const messages: Record<string, string> = { unauthorized: 'يجب تسجيل الدخول بحساب إداري نشط.', forbidden: 'لا تملك صلاحية إدارة الدعوات.', invitation_role_forbidden: 'لا يمكنك إسناد دور أعلى من صلاحياتك.', invitation_rate_limited: 'انتظر دقيقة قبل إعادة إرسال الدعوة.', invitation_already_pending: 'توجد دعوة معلقة لهذا البريد. استخدم إعادة الإرسال من تبويب الدعوات.', account_already_exists: 'البريد مرتبط بحساب موجود ولا يمكن استبدال بيانات دخوله بدعوة.', invitation_not_resendable: 'لا يمكن إعادة إرسال هذه الدعوة.', invitation_not_revocable: 'لا يمكن إلغاء هذه الدعوة.', invalid_invitation: 'أدخل اسم الموظف وبريدًا صالحًا واختر الدور.' };
    return reply({ message: messages[code] ?? 'تعذر إكمال الدعوة. تحقق من الحالة وأعد المحاولة.' }, code === 'unauthorized' ? 401 : code === 'forbidden' || code === 'invitation_role_forbidden' ? 403 : code === 'invitation_rate_limited' ? 429 : 400);
}
export async function issueInvitation(request: Request, previousId?: string) {
    try {
        const { admin, actor } = await invitationManager(request);
        let body = await smallBody(request);
        if (previousId) {
            const old = await admin.from('employee_invitations').select('email,full_name,role_id').eq('id', previousId).single();
            check(old.error);
            if (!old.data)
                throw Error('invitation_not_resendable');
            body = { email: old.data.email, fullName: old.data.full_name, roleId: old.data.role_id };
        }
        if (!validInvitationInput(body))
            throw Error('invalid_invitation');
        const email = body.email.trim().toLowerCase();
        const allowed = await admin.rpc('employee_invitation_can_assign', { actor, target_role: body.roleId });
        check(allowed.error);
        if (allowed.data !== true)
            throw Error('invitation_role_forbidden');
        const existing = await admin.from('admin_profiles').select('id,status,deleted_at,last_login_at').eq('email', email).maybeSingle();
        check(existing.error);
        if (existing.data && (existing.data.status !== 'invited' || existing.data.deleted_at || existing.data.last_login_at))
            throw Error('account_already_exists');
        if (!existing.data) {
            const created = await admin.auth.admin.createUser({ email, email_confirm: false, user_metadata: { full_name: body.fullName.trim() } });
            if (created.error || !created.data.user)
                throw Error('account_already_exists');
            const profile = await admin.from('admin_profiles').insert({ id: created.data.user.id, email, full_name: body.fullName.trim(), status: 'invited' });
            if (profile.error) {
                await admin.auth.admin.deleteUser(created.data.user.id);
                check(profile.error);
            }
        }
        const token = randomBytes(32).toString('base64url');
        const result = await admin.rpc('employee_invitation_issue', { actor, recipient: email, employee_name: body.fullName.trim(), target_role: body.roleId, digest: digestToken(token), previous_id: previousId ?? null });
        check(result.error);
        const row = (Array.isArray(result.data) ? result.data[0] : result.data) as EmployeeInvitation;
        if (!row) throw Error('invitation_failed');
        const role = await admin.from('roles').select('name_ar,name_en').eq('id', row.role_id).single();
        check(role.error);
        if (!role.data)
            throw Error('invitation_role_forbidden');
        const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL!);
        if (origin.protocol !== 'https:' || origin.hostname !== 'nourappglobal.com')
            throw Error('invalid_site_origin');
        const link = `${origin.origin}/admin/login/invite#token=${token}`;
        try {
            await queueInvitationMail(invitationEmail({ email, name: row.full_name, inviter: row.invited_by_name, role: role.data.name_ar, link }), email);
        }
        catch {
            await admin.from('employee_invitations').update({ status: 'failed' }).eq('id', row.id).eq('status', 'pending');
            return reply({ message: 'حُفظت الدعوة، لكن تعذر تسليمها لخدمة البريد. استخدم إعادة الإرسال.' }, 502);
        }
        const sent = await admin.from('employee_invitations').update({ sent_at: new Date().toISOString() }).eq('id', row.id).eq('status', 'pending');
        check(sent.error);
        return reply({ message: 'قُبلت الدعوة في خدمة البريد. صلاحية الرابط 24 ساعة.', invitationId: row.id }, 201);
    }
    catch (error) {
        return invitationError(error);
    }
}
export async function listInvitations() {
    try {
        const { admin, actor } = await invitationManager();
        const rows = await admin.from('employee_invitations').select('id,email,full_name,role_id,invited_by_name,status,created_at,sent_at,expires_at,accepted_at').order('created_at', { ascending: false }).limit(500);
        check(rows.error);
        const roles = await admin.from('roles').select('id,key,name_ar,name_en').eq('is_active', true).is('deleted_at', null).order('sort_order');
        check(roles.error);
        const summaries: InvitationRole[] = [];
        for (const role of roles.data ?? []) {
            const allowed = await admin.rpc('employee_invitation_can_assign', { actor, target_role: role.id });
            check(allowed.error);
            if (allowed.data !== true)
                continue;
            const permissions = await admin.from('role_permissions').select('permission:permissions(key,name_ar,name_en)').eq('role_id', role.id);
            check(permissions.error);
            summaries.push({ ...role, permissions: (permissions.data ?? []).map(p => p.permission).flat().filter(Boolean) as unknown as InvitationRole['permissions'] });
        }
        return reply({ invitations: rows.data, roles: summaries });
    }
    catch (error) {
        return invitationError(error);
    }
}
