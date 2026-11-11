import { invitationManager, invitationError, issueInvitation, smallBody, reply } from '../../../../../../src/server/invitations/manage';
export async function POST(request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    try {
        const { id } = await params;
        if (!/^[a-f0-9-]{36}$/i.test(id))
            return reply({ message: 'دعوة غير صالحة.' }, 400);
        const { admin, actor } = await invitationManager(request);
        const body = await smallBody(request.clone());
        if (body.action === 'resend')
            return issueInvitation(request, id);
        if (body.action !== 'revoke')
            return reply({ message: 'إجراء غير صالح.' }, 400);
        const result = await admin.rpc('employee_invitation_revoke', { actor, invitation_id: id });
        if (result.error)
            throw Error(result.error.message);
        return reply({ message: 'أُلغيت الدعوة وأُبطل رابطها.' });
    }
    catch (error) {
        return invitationError(error);
    }
}
