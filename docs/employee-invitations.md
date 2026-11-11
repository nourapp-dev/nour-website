# Employee directory and invitations

The employee directory has separate Employees, Invitations, and Roles tabs.
Invites collect the employee name, work email, selected role, and a permission
summary. Legacy pending accounts appear separately and are never automatically
reinvited or assigned a role. Employee lists now include admin profiles only.

## Lifecycle

- A server-only invitation ledger stores SHA-256 hashes of random 256-bit tokens.
- Links expire after 24 hours. Resending rotates the token and revokes the old
  invitation. Resends are limited to one per minute per email address.
- Tokens live in a URL fragment, are removed from the address bar after loading,
  and are submitted in request bodies. Previewing never consumes a token.
- Acceptance claims the invitation under a database lock. Only the pre-created,
  never-activated administrative identity for that email can be activated.
- The server confirms the Auth user's email before setting the password.
  Password setup uses the server Auth API; the browser cannot update its own
  admin status through RLS. Finalization atomically assigns the selected role,
  activates the profile, and records acceptance. Revocation wins over a pending
  finalization. Failed activation leaves no active administrative access.
- The inviter must remain active and authorized. A non-super-admin cannot assign
  super-admin or a role containing permissions they do not have.
- Every invitation management operation checks an active administrative session
  and users.manage. Ledger tables and RPCs are service-role only; normal clients
  have neither table access nor execute grants. No new SECURITY DEFINER is used.

## Mail

Messages include the employee, inviter, role, single-use/expiry notice and
activation button, with Arabic/English content and escaped user-supplied text.
Sender: `Nour App <noreply@nourappglobal.com>`. Replies go to support.

The VPS has this mailbox, a local Exim service, and SPF authorizing its MX host.
Nodemailer submits to loopback port 25 with verified STARTTLS and TLS server name
`mail.nourappglobal.com`. It does not disable certificate validation or use a
setuid sendmail executable under the application's NoNewPrivileges restriction.
Queue acceptance is shown separately from inbox delivery. Failures are retained
as failed invitations and can be retried. Actual SMTP/TLS/relay verification on
this host is a required deployment check; it was interrupted when the browser
connection to the VPS became unavailable. No employee emails were sent in tests.

## Deployment

1. Apply the generated employee_invitation_lifecycle migration. This was applied
   to production as version 20261111000004, with zero invitation rows created.
2. Install the pinned nodemailer dependencies and build a fresh release with the
   real production environment. Do not deploy CI-placeholder build artifacts.
3. Verify local SMTP STARTTLS and relay acceptance using MAIL/RCPT followed by
   RSET/QUIT, without submitting a DATA message or sending employee invitations.
4. Preview the admin page in Arabic/English and light/dark modes, including the
   invite modal and role tabs. Test only read-only/invalid-token endpoints on
   production. Use the existing deployment script and its rollback support.
5. An authorized real invitation is needed to verify inbox delivery end to end;
   queue acceptance alone must never be described as confirmed delivery.

## Tests

PGlite exercises the actual migration: single use, expiry, unsent-token rejection,
resend cooldown/rotation, cancellation during acceptance, role escalation, and
activation with role assignment. MIME and SMTP transport tests make no real sends.
The directory DOM test opens a legacy invite without invoking a mutation and
checks that unsaved role choices survive tab changes.
