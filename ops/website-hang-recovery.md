# Website hang recovery

Incident: 2026-11-10. The production Next.js main thread consumed a full CPU
core while accepting no HTTP responses, including local static assets. Nginx
returned 504. systemd still reported the service as active. SIGTERM did not stop
it; systemd killed it after TimeoutStopSec=30. Restart restored HTTP 200.
No stack profile of the old process was preserved, so the exact JavaScript
cause is not established. The recovery mechanism below mitigates downtime;
it does not claim to fix the unknown triggering code.

## Installed recovery

- `website-healthcheck.sh` runs outside Node every minute, with a two minute
  startup grace period. It probes an existing static asset on 127.0.0.1:3100,
  independent of database availability. Three failed probes trigger recovery.
- It shares the deploy script's flock lock, respects stopped services, and
  allows at most one recovery restart per ten minutes. A failed recovery is
  recorded as a failed healthcheck, rather than reported as successful.
- Incident summaries are root-only under `/var/lib/nour-website-health`.
- Node signal reports are enabled by adding this line under `[Service]` in the
  existing main unit, after checking there is no existing NODE_OPTIONS value:

  ```ini
  Environment=NODE_OPTIONS="--report-on-signal --report-exclude-env --report-exclude-network --report-directory=/var/lib/nour-website-reports"
  ```

  The directory is mode 0700, owned by nourapp. The checker requests a report
  before recovery only when this option is explicitly enabled. Reports omit
  environment variables and network interface diagnostics. A blocked process
  may still fail to emit a report; recovery proceeds regardless. Old incident
  files and reports are pruned after 14 days during recovery.

## Installation / verification

Run as root, preserving the original main unit before changing it:

```sh
install -d -m 700 /var/lib/nour-website-health
install -d -m 700 -o nourapp -g nourapp /var/lib/nour-website-reports
install -m 755 ops/website-healthcheck.sh /usr/local/sbin/nour-website-healthcheck
install -m 644 ops/nour-website-healthcheck.service ops/nour-website-healthcheck.timer /etc/systemd/system/
systemd-analyze verify /etc/systemd/system/nour-website-healthcheck.service /etc/systemd/system/nour-website-healthcheck.timer
systemctl daemon-reload
systemctl restart nour-website.service
systemctl enable --now nour-website-healthcheck.timer
```

After startup grace, check `systemctl show nour-website-healthcheck.service
-p Result -p ExecMainStatus --no-pager` and HTTP 200 for the local asset and
public homepage. Use `journalctl -u nour-website-healthcheck.service --no-pager`
for recovery history. Do not share diagnostic reports publicly.

Tests: `python3 -m unittest discover -s tests/ops -v`. Tests replace systemd,
HTTP probes, state paths, and sleeps; they never restart a real service.

## Rollback

Disable the timer with `systemctl disable --now nour-website-healthcheck.timer`.
Restore the saved main service unit, then daemon-reload and restart the main
service. Retain private incident files for investigation.

The production installation backup is
`/root/nour-website-backups/hang-recovery-20261110-230733`.
