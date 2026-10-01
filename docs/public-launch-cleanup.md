# Public launch content cleanup

## Scope

- Header, footer and floating WhatsApp button now resolve contact details from the same public platform settings. The observed incomplete Saudi support number falls back to the already configured WhatsApp number, `+966567488377`; a future valid support-number change is reflected consistently.
- Empty/malformed social URLs such as `https://` and `https` are omitted. Only complete HTTP(S) links with a hostname are rendered.
- While website booking is paused, the payment card states that booking/payment are paused, links to the contact section, and does not advertise payment methods. Enabling booking restores its payment-section link.
- Empty program catalogs have a contact action and are distinguished from searches with no matches.
- A placeholder CEO message such as `test` is omitted in that language. No replacement quote is invented.

The public catalog returned **zero published programs** during the follow-up check on 2026-10-01 UTC (2026-10-02 Riyadh). This was verified through the public website and its normal Supabase client query. No program record was deleted, changed to draft or filtered by a hard-coded identifier in this change. Keep using the existing publication controls to publish reviewed real programs. The current empty catalog does not establish why the formerly visible test programs became unavailable.

Database settings were not modified. The public rendering now rejects the observed malformed values and uses the existing valid contact defaults. An administrator can correct the underlying values through the platform settings page.

## VPS update

`ops/deploy-hostinger.sh` is for the existing installation described in [the VPS runbook](hostinger-vps.md). Clone the reviewed branch into a **new** directory under `/home/nourapp/nour-website-releases/`, owned by `nourapp`. Run the script as root with the exact reviewed 40-character commit SHA. Never run it inside the active release.

The script checks the current service definition and release SHA, copies the private environment locally, installs and builds with Webpack as `nourapp`, and verifies a candidate on loopback port 3101. It then updates both service paths, restarts port 3100, and checks the public homepage, a JavaScript asset and the paused booking API. The restart causes a brief interruption. A failed cutover restores the saved service definition and restarts the old release; inspect the service logs if it reports `ROLLBACK_NEEDS_ATTENTION`.

Run it with `nohup` and a root-only log so a Web Console disconnect does not interrupt the build. Success is **`NOUR_UPDATE_READY`**, followed by the deployed commit, release directory and backup path. A background PID is not a success result. If the script stops, review its log before retrying.

The script does not change Nginx, DNS, Supabase records or booking activation. Public browser verification after deployment still covers the hydrated footer, social links, language switch and payment contact link, since an HTTP homepage check cannot verify those interactions.
