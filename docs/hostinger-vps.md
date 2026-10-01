# Hostinger VPS deployment

This runbook records the deployment verified on **2026-10-01 UTC**. Server results were supplied by the operator through the Hostinger Web Console; the public homepage, language switch, catalog and one program detail page were also checked in a browser.

## Installed layout

| Item | Location / value |
| --- | --- |
| Public URL | `https://nourappglobal.com` |
| VPS | Existing Hostinger KVM 2, AlmaLinux 8, cPanel |
| Application account | `nourapp` |
| Initial release | Commit `9ed4386452886783b10a0c8f83a8bae4c5e65171` on `feat/website-browse-mode-hostinger` |
| Live application | `/home/nourapp/nour-website-staging` |
| Runtime directory | `/home/nourapp/nour-website-runtime` |
| Node.js | `/home/nourapp/nour-website-runtime/node-v24.21.0-linux-x64/bin/node` |
| Service definition | `/etc/systemd/system/nour-website.service` |
| Next.js listener | `127.0.0.1:3100` |
| Domain proxy include | `/etc/nginx/conf.d/users/nourapp/nourappglobal.com/nour-website.conf` |
| Initial cutover backup | `/root/nour-website-backups/20261001-212803` |

Despite its name, `nour-website-staging` is the **live production release**. The default GitHub branch does not necessarily contain this release while the stacked pull requests remain unmerged. Deploy a reviewed commit explicitly.

The existing `/home/nourapp/public_html` contains other applications. Leave those files, the global Node.js installation, cPanel, Apache and other domain configurations intact. The Next.js process binds only to loopback; public traffic enters through Nginx.

DNS already pointed the apex and `www` names at this VPS. The cutover used the existing certificate and did not change DNS or mail records. Supabase remains the database, storage and authentication provider.

## Environment and booking pause

Store `.env.local` privately in each release, owned by `nourapp` with mode `600`. Use the existing Supabase project's values; do not put credentials in this document or Git.

```dotenv
NEXT_PUBLIC_SITE_URL=https://nourappglobal.com
NEXT_PUBLIC_SUPABASE_URL=<existing-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<existing-public-publishable-key>
NEXT_PUBLIC_WEBSITE_BOOKING_ENABLED=false
```

Public variables are compiled into the client build. Keep the booking flag `false` both at build time and in the service environment. Changing only the runtime environment does not update the compiled interface.

With bookings paused, `POST /api/bookings` returns HTTP **503** with `{"code":"website_booking_paused"}` before authentication, parsing booking details or database operations. The homepage and program details remain available. This response is expected and must not be treated as a homepage outage.

The pause applies to this website release. It does not revoke Supabase RPC permissions, disable the mobile application, or disable an older website deployment. Verify and retire any previous public website deployment separately after cutover.

Administrator user-management endpoints can require `SUPABASE_SERVICE_ROLE_KEY`. It is server-only, must never have a `NEXT_PUBLIC_` prefix, and was not needed for this public browsing deployment. Those administrator operations were not validated by the public checks.

## Building on this VPS

AlmaLinux 8 has glibc 2.28. The installed Next.js native SWC binary reported a missing `GLIBC_2.29` symbol and fell back to WebAssembly. Turbopack could not build with that fallback. **Webpack completed successfully with the same application and environment.** Do not replace the system's glibc or reinstall the OS to address this build warning.

For a newly prepared, isolated release directory, use the dedicated Node.js runtime as `nourapp`:

```sh
export PATH="/home/nourapp/nour-website-runtime/node-v24.21.0-linux-x64/bin:$PATH"
npm ci
npm run quality
npm test
nice -n 10 env NODE_OPTIONS=--max-old-space-size=3072 npm run build -- --webpack
test -s .next/BUILD_ID
```

The initial release passed 19 tests. Its build ran in the background with `nohup` and an exclusive `flock`, and recorded `BUILD_EXIT=0` and `NOUR_BUILD_READY` in `/home/nourapp/nour-website-runtime/build-webpack.log`. A build PID alone does not mean the build succeeded. Preserve a separate log per future release and wait for the final exit status before starting it.

The application uses `next start`, not a static export or standalone output. No global Node.js upgrade was required.

## systemd service

The initial service definition is:

```ini
[Unit]
Description=Nour website
After=network.target

[Service]
Type=simple
User=nourapp
Group=nourapp
WorkingDirectory=/home/nourapp/nour-website-staging
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_WEBSITE_BOOKING_ENABLED=false
Environment=PATH=/home/nourapp/nour-website-runtime/node-v24.21.0-linux-x64/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/nourapp/nour-website-runtime/node-v24.21.0-linux-x64/bin/node /home/nourapp/nour-website-staging/node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
UMask=0077
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

The unit is owned by root, mode `644`, enabled and active. Next.js reads the release's `.env.local`; this unit does not source it as a shell script.

Read-only operational checks:

```sh
systemctl is-active nour-website.service
systemctl is-enabled nour-website.service
journalctl -u nour-website.service -n 40 --no-pager
curl -sS --max-time 15 -o /dev/null -w 'HOME_HTTP=%{http_code}\n' http://127.0.0.1:3100/
```

Expect `active`, `enabled` and `HOME_HTTP=200`. Review logs locally and redact credentials or personal data before sharing them.

## cPanel Nginx routing

`/etc/nginx/conf.d/users/nourapp.conf` is generated by cPanel. It already contains `location /` and includes domain-specific configuration files. Do not edit that generated file or add another `location /` in the custom include.

The deployed domain include is:

```nginx
set $nour_website_request 0;
if ($host ~* ^(www\.)?nourappglobal\.com$) {
    set $nour_website_request 1;
}
if ($uri ~ ^/\.well-known/) {
    set $nour_website_request 0;
}
if ($nour_website_request = 1) {
    set $CPANEL_APACHE_PROXY_PASS http://127.0.0.1:3100;
    set $CPANEL_SKIP_PROXY_CACHING 1;
}
set $nour_website_redirect "$nour_website_request:$scheme:$host";
if ($nour_website_redirect ~ ^1:http:) {
    return 308 https://nourappglobal.com$request_uri;
}
if ($nour_website_redirect = "1:https:www.nourappglobal.com") {
    return 308 https://nourappglobal.com$request_uri;
}
```

This uses the variables in the inspected cPanel configuration to route the apex and `www` hosts to Next.js and bypass proxy cache reads and writes. `/.well-known/` stays with the existing Apache route for certificate validation. The `mail` and direct-IP aliases retain their original upstream. Other domains use their existing server blocks.

HTTP redirects to the HTTPS apex. HTTPS `www` also redirects to the apex. The initial cutover validated `nginx -t` before and after the change, then reloaded Nginx. After a cPanel/Nginx update, recheck this include and the generated variable names against the current configuration before relying on them.

## Health checks after deployment

Check the public homepage and redirects with certificate verification enabled:

```sh
curl -sS --max-time 15 -o /dev/null -w 'HOME_HTTP=%{http_code}\n' https://nourappglobal.com/
curl -sSI --max-time 15 http://nourappglobal.com/
curl -sSI --max-time 15 https://www.nourappglobal.com/
```

Expect homepage **200**, HTTP **308** to `https://nourappglobal.com/`, and HTTPS `www` **308** to the same apex URL. Also load an actual JavaScript asset URL from the new homepage; a homepage response alone does not prove that its assets are served correctly.

For this paused release only, this empty request should return the pause response without creating a reservation:

```sh
curl -sS --max-time 15 -X POST \
  -H 'Content-Type: application/json' --data '{}' \
  -w '\nBOOKING_HTTP=%{http_code}\n' \
  https://nourappglobal.com/api/bookings
```

Expect `{"code":"website_booking_paused"}` and `BOOKING_HTTP=503`. If that response changes, investigate the release and flag before submitting any booking details.

The initial cutover checked the homepage, a real `/_next/static/` JavaScript asset, the booking pause and both redirects against the local Nginx endpoint using `curl --resolve`, without disabling TLS verification. The operator received `NOUR_DOMAIN_READY`. An external browser then loaded the public homepage in Arabic and English, the catalog and a program detail page with its pause notice.

## Updating without rebuilding the running release

1. Select a reviewed commit and record the currently running release path. Back up `/etc/systemd/system/nour-website.service` and the domain include to a new root-only backup directory. Keep the current release available for rollback.
2. Prepare a **new** directory such as `/home/nourapp/nour-website-releases/<release-id>`, owned by `nourapp` and outside `public_html`. Check out the selected commit there. Do not run `git pull`, `npm ci` or `next build` in the directory used by the active service.
3. Copy the current private environment file into the new release, retain owner `nourapp` and mode `600`, and confirm the final site URL and paused booking flag. Build and verify the new release using the dedicated runtime and Webpack command above. Wait for success and a nonempty `.next/BUILD_ID`.
4. Check that a separate loopback port, for example `3101`, is free. Start the candidate as `nourapp` on `127.0.0.1` using that port. Check its homepage, assets, program rendering and pause response before cutover. Stop only this candidate process after verification. A loopback check does not replace testing browser authentication on an approved HTTPS preview URL when authentication behavior changes.
5. Point **both** `WorkingDirectory` and the application path in `ExecStart` to the new release, retaining the loopback production port `3100` and the existing service protections. Then run `systemctl daemon-reload` and `systemctl restart nour-website.service`. This process restart causes a brief interruption; it is not a zero-downtime deployment.
6. Run the internal and public health checks above. If they fail, restore the saved unit, run `systemctl daemon-reload` and restart the service to use the previous intact release, then verify it. Keep the Nginx route at `127.0.0.1:3100` throughout a normal application update.
7. Record the new commit, release path and backup directory. Retain the previous release until the new one is accepted. No dependency installation or source checkout belongs in the running release directory.

For booking activation, also update the service's booking flag, rebuild with the matching public flag, and complete authenticated booking/payment tests in a test environment first. Do not activate booking just to test the deployment.

## Initial proxy cutover rollback

The backup at `/root/nour-website-backups/20261001-212803` contains the pre-cutover generated Nginx domain configuration and verification output. It is not a database or full-server backup.

To undo only the initial proxy cutover, preserve the custom `nour-website.conf` by moving it out of Nginx's included `*.conf` path, run `nginx -t`, and reload Nginx only if validation succeeds. If validation fails, restore the include before any reload. This returns the domain to the previous **Apache document-root content on this VPS**; it does not restore a former external hosting deployment. The generated cPanel configuration and files under `public_html` were not overwritten.

## Remaining launch checks

The deployment is serving the site, but public content still needs review before promotion: several published programs have test names/prices, the English CEO message is `test`, the footer phone differs from the header, and social links contain placeholders. The paused homepage also retains a payment-options link to the hidden `#payments` section. These findings were observed; no production content was edited during verification.

Authenticated customer/admin flows, the Supabase redirect allowlist and retirement of any previous website deployment still require verification. No real reservation or payment was created by the deployment checks. Keep website bookings paused until their separate activation review is complete.

## References

- [cPanel: Customize Nginx reverse-proxy configurations](https://docs.cpanel.net/knowledge-base/nginx/customize-reverse-proxy-nginx-configurations/)
- [cPanel: Default Nginx reverse-proxy configuration](https://docs.cpanel.net/knowledge-base/nginx/the-default-configuration-of-nginx-with-reverse-proxy/)
- [Next.js: Self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js: Turbopack supported platforms](https://nextjs.org/docs/app/api-reference/turbopack#supported-platforms)
- [Node.js 24.21.0 release](https://nodejs.org/en/blog/release/v24.21.0)
