#!/usr/bin/env bash
# Independent of Node's event loop: systemd Restart=on-failure cannot detect hangs.
set -Eeuo pipefail
umask 077

nour_service=nour-website.service
nour_state=/var/lib/nour-website-health
nour_probe=http://127.0.0.1:3100/images/brand/nour-horizontal-light.svg
exec 9>/run/lock/nour-website-deploy.lock
flock -n 9 || exit 0
systemctl is-active --quiet "$nour_service" || exit 0

# Leave deployments and startup alone, including slow first starts.
nour_started=$(systemctl show "$nour_service" -p ExecMainStartTimestamp --value)
nour_started_epoch=$(date -d "$nour_started" +%s 2>/dev/null) || exit 0
nour_now=$(date +%s)
(( nour_now - nour_started_epoch >= 120 )) || exit 0

probe() {
  local code
  code=$(curl --noproxy '*' --silent --output /dev/null --connect-timeout 2 \
    --max-time 5 --write-out '%{http_code}' "$nour_probe") || return 1
  [[ "$code" == 200 ]]
}
for nour_attempt in 1 2 3; do
  if probe; then exit 0; fi
done

install -d -m 700 "$nour_state"
nour_last=0
if [[ -r "$nour_state/last-restart" ]]; then
  read -r nour_last < "$nour_state/last-restart" || true
  [[ "$nour_last" =~ ^[0-9]+$ ]] || nour_last=0
fi
if (( nour_now - nour_last < 600 )); then
  echo 'Website remains unresponsive; restart cooldown is active.' >&2
  exit 1
fi
# Recheck in case an operator stopped the service during the probes.
systemctl is-active --quiet "$nour_service" || exit 0
nour_log="$nour_state/incident-$nour_now.log"
{
  date -u
  echo 'Three local HTTP probes failed. Capturing diagnostics before recovery.'
  systemctl show "$nour_service" -p ActiveState -p SubState -p MainPID -p MemoryCurrent
  nour_pid=$(systemctl show "$nour_service" -p MainPID --value)
  if [[ "$nour_pid" =~ ^[1-9][0-9]*$ ]]; then
    ps -L -p "$nour_pid" -o pid,tid,pcpu,pmem,etime,stat,comm || true
  fi
  journalctl -u "$nour_service" -n 60 --no-pager || true
} > "$nour_log" 2>&1
# Ask Node for a stack/heap report before killing the hung process. Only send
# SIGUSR2 when the unit explicitly enables reports (otherwise it terminates Node).
if systemctl show "$nour_service" -p Environment --value | grep -Fq -- '--report-on-signal'; then
  systemctl kill --kill-who=main --signal=SIGUSR2 "$nour_service" || true
  sleep 2
fi
# Bound diagnostic retention. Never record environment variables or credentials.
find "$nour_state" -maxdepth 1 -type f -name 'incident-*.log' -mtime +14 -delete
if [[ -d /var/lib/nour-website-reports ]]; then
  find /var/lib/nour-website-reports -maxdepth 1 -type f -name 'report.*.json' -mtime +14 -delete
fi
printf '%s\n' "$nour_now" > "$nour_state/last-restart"
echo "Website unresponsive; restarting $nour_service. Diagnostics: $nour_log"
systemctl restart "$nour_service"
for nour_attempt in 1 2 3 4 5; do
  if probe; then
    echo 'Website response restored (HTTP 200).'
    exit 0
  fi
  sleep 2
done
echo 'Website did not recover after restart; inspect the saved incident.' >&2
exit 1
