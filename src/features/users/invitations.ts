export type EmployeeInvitation = {
    id: string;
    email: string;
    full_name: string;
    role_id: string;
    invited_by_name: string;
    status: 'pending' | 'processing' | 'accepted' | 'revoked' | 'failed';
    created_at: string;
    sent_at: string | null;
    expires_at: string;
    accepted_at: string | null;
};
export type InvitationRole = {
    id: string;
    key: string;
    name_ar: string;
    name_en: string;
    permissions: {
        key: string;
        name_ar: string;
        name_en: string;
    }[];
};
export function invitationState(row: EmployeeInvitation, now = Date.now()) { return row.status === 'pending' && Date.parse(row.expires_at) <= now ? 'expired' : row.status; }
export function validInvitationInput(b: {
    email?: unknown;
    fullName?: unknown;
    roleId?: unknown;
}) { return typeof b.email === 'string' && b.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim()) && typeof b.fullName === 'string' && b.fullName.trim().length > 0 && b.fullName.length <= 100 && typeof b.roleId === 'string' && /^[a-f0-9-]{36}$/i.test(b.roleId); }
