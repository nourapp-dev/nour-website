import { issueInvitation } from '../../../../../src/server/invitations/manage';
export const runtime = 'nodejs';
export async function POST(request: Request) { return issueInvitation(request); }
