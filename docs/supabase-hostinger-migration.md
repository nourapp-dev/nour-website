# Supabase migration readiness

Status: migration deferred by the owner on 2026-10-02 (Asia/Riyadh). The website remains on Hostinger with the existing managed Supabase project for Database, Auth and Storage. Do not continue target installation or data transfer as part of repository cleanup.

Source inventory and operator-run host preflight completed on 2026-10-01 UTC. No target stack was installed and no data was transferred. No source data, credentials, DNS records or server packages were changed during the inventory. The following assessment is retained for a future migration request.

## Destination decision

The existing website VPS runs AlmaLinux 8 with cPanel 138 and several other applications. cPanel's current support article documents a conflict between Docker/Kubernetes and `ea-podman` starting with version 138. A small database does not resolve this package compatibility problem.

Run `bash ops/check-supabase-host.sh` on the proposed destination and review its output before installing anything. The script reads OS, CPU, memory, disk, selected installed package versions, listening ports and service status. It does not read credentials or change the host.

Prefer a dedicated Hostinger VPS without cPanel for the self-hosted stack if the compatibility conflict applies. Selecting or purchasing that destination is a separate operator decision. Do not remove cPanel packages, replace the OS, stop existing applications or force package dependency resolution to make Docker install.

The supplied host output confirms that `ea-podman` is installed, `/usr/bin/docker` invokes Podman 4.9.4, and no Compose provider was found. The website service was active. The `ServerVersion` template error came from this diagnostic attempting a Docker-specific query against Podman; it is not evidence of a website or database failure. The diagnostic now identifies the wrapper before selecting engine-specific checks.

Using the existing Podman installation is a possible alternative that needs a separate compatibility trial. Supabase's current Auth keys guide explicitly requires `podman-compose >= 1.6.0` for its nested environment-variable expressions. This does not establish that the whole stack works with the installed Podman release or the current shared host. Before choosing this route, verify the pinned stack, Compose provider, networks, volume permissions, resource limits and startup recovery using an empty private deployment. Review the selected Compose file for Docker-socket dependencies and exposed ports. Do not import production data or switch the website until the trial succeeds.

Supabase currently documents a minimum of 4 GB RAM, 2 CPU cores and 40 GB SSD for the complete stack, with 8 GB RAM, 4 cores and 80 GB SSD recommended. Those requirements are additional to other workloads sharing a host; they are not a guarantee of capacity.

## Source and compatibility inventory

The source uses PostgreSQL 17. Re-run `ops/supabase-migration-inventory.sql` against the intended source and retain its output privately as the comparison baseline. It returns counts and metadata, not user records or secrets. Actual database dumps and storage credentials must stay outside this public repository.

The website uses Database, Auth, Storage, public RPCs, row-level security and administrator roles. A SQL export alone does not transfer the storage file contents or hosted Auth/email settings. The initial inspection found no deployed Edge Functions; recheck immediately before migration. Do not use migration files in this repository as a substitute for a verified backup of the live project.

Use a reviewed, pinned self-hosted Supabase release with PostgreSQL 17. Inspect its actual Compose file and release notes together: some overview docs still describe older defaults. Relevant 2026 changes include the PostgreSQL 17 transition, the Envoy `api-gw` service, and `API_EXTERNAL_URL` including `/auth/v1`. Review extension compatibility and newer Auth/Storage schemas during a trial restore. Do not silently discard incompatible source rows to get an import to pass.

## Trial restore

1. Prepare the approved destination separately from the running website. Generate fresh secrets on that host, keep PostgreSQL and the pooler off public interfaces, and expose the required API through HTTPS. Restrict Studio access. Keep the deployment private until credentials and routes have been reviewed.
2. Confirm the source connection endpoint and enter its credentials privately on the transfer host. Check the installed CLI with `supabase --version` and `supabase db dump --help`. Export roles, schema and data using the documented Supabase CLI filters. Verify the resulting backup includes the required Auth data, RLS policies, functions, triggers and custom Storage policies. Keep checksums and an encrypted backup outside the destination VPS.
3. Restore into a fresh trial database with errors treated as failures. Use a single transaction for the final restore and the documented trigger handling. Match installed extensions and compare table counts, policies, functions, ownership and application grants. Retain administrator account identifiers and role links.
4. Transfer object contents through the supported Storage/S3 API, preserving bucket names, object paths, public/private settings and ownership metadata. Copying rows in `storage.objects` or dropping downloaded files into the Storage volume is insufficient. Compare object counts and sizes, and verify a public image and a private document with authorized access. Confirm anonymous access to private documents remains denied.
5. Recreate Auth configuration, redirect URLs and SMTP settings. Existing accounts are transferable, but new signing keys require users to sign in again. Verify login, password recovery, role enforcement, media access and administrator operations using test accounts. Do not send test email to unrelated users.
6. Create a separate website release with the new API URL and keys. `NEXT_PUBLIC_*` values and the Supabase CSP origin are fixed during the Next.js build, so rebuild. Keep `NEXT_PUBLIC_WEBSITE_BOOKING_ENABLED=false`. Validate the trial website on an approved HTTPS preview origin before production switching.

## Cutover and rollback

Website booking is paused, but other writes can still occur through administrator tools, newsletter forms, analytics, other applications and older deployments. Inventory and pause all relevant writers for the final synchronization; do not assume the booking flag freezes the database. Compare the final backup and copied files before changing the website's provider.

Switch the website only after the trial restore and final synchronization pass. Verify public browsing, administrator authentication, images, private-file access and the booking pause. Retain the old release and managed project during acceptance.

If writes have reached the new database, rolling back only the website environment would lose or split those changes. Pause writes, reconcile the delta, and then switch providers. Agree on this rollback procedure before production cutover.

Before retiring the managed project, configure scheduled database and object backups to a separate destination, verify a restore, and define service monitoring and update ownership.

## References

- [cPanel Docker compatibility](https://support.cpanel.net/hc/en-us/articles/360062418794-Can-I-run-docker-on-a-cPanel-server)
- [Supabase Docker deployment](https://supabase.com/docs/guides/self-hosting/docker)
- [Supabase Auth keys and Podman Compose compatibility](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys)
- [Restore a managed project](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- [Copy Storage objects](https://supabase.com/docs/guides/self-hosting/copy-from-platform-s3)
- [Supabase changelog](https://supabase.com/changelog)
- [PostgreSQL 17 self-hosted transition](https://supabase.com/changelog/46080-self-hosted-supabase-upgrading-from-pg-15-to-17-breaking-change)
- [Envoy gateway transition](https://supabase.com/changelog/48048-self-hosted-supabase-envoy-becomes-the-default-api-gateway-b)
- [Auth URL prefix transition](https://supabase.com/changelog/47093-self-hosted-supabase-api-external-url-to-include-auth-v1)
