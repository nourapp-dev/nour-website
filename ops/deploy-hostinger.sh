#!/usr/bin/env bash
# Run as root from a fresh release clone, passing its reviewed full commit SHA.
# Keeps website booking paused. Does not change Nginx, DNS or database records.
set -Eeuo pipefail
umask 077

fail() { printf 'DEPLOY_STOP: %s\n' "$*" >&2; exit 1; }
[ "$(id -u)" = 0 ] || fail 'Run from the VPS root console.'
nour_expected=${1:-}
[[ "$nour_expected" =~ ^[0-9a-f]{40}$ ]] || fail 'Pass the reviewed full commit SHA.'
nour_release=$(cd -- "$(dirname -- "$0")/.." && pwd -P)
[[ "$nour_release" =~ ^/home/nourapp/nour-website-releases/[a-zA-Z0-9._-]+$ ]] || fail 'Use a separate directory under nour-website-releases.'
nour_runtime=/home/nourapp/nour-website-runtime/node-v24.21.0-linux-x64/bin
nour_unit=/etc/systemd/system/nour-website.service
nour_service=nour-website.service
[ -x "$nour_runtime/node" ] || fail 'The dedicated Node.js runtime is missing.'
exec 9>/run/lock/nour-website-deploy.lock
flock -n 9 || fail 'Another website deployment is running.'
systemctl is-active --quiet "$nour_service" || fail 'The existing service must be healthy before updating.'
[ "$(systemctl show -p FragmentPath --value "$nour_service")" = "$nour_unit" ] || fail 'Unexpected service unit path.'
[ -z "$(systemctl show -p DropInPaths --value "$nour_service")" ] || fail 'Review existing service overrides first.'
nour_previous=$(systemctl show -p WorkingDirectory --value "$nour_service")
case "$nour_previous" in
  /home/nourapp/nour-website-staging|/home/nourapp/nour-website-releases/*) ;;
  *) fail 'Unexpected active application directory.' ;;
esac
[ "$nour_release" != "$nour_previous" ] || fail 'Never build in the running release.'
[ -r "$nour_previous/.env.local" ] || fail 'The active release environment is missing.'
[ "$(runuser -u nourapp -- git -C "$nour_release" rev-parse HEAD)" = "$nour_expected" ] || fail 'Release commit differs from the reviewed commit.'
[ -z "$(runuser -u nourapp -- git -C "$nour_release" status --porcelain --untracked-files=no)" ] || fail 'The release has modified tracked files.'
grep -Fxq 'Environment=NEXT_PUBLIC_WEBSITE_BOOKING_ENABLED=false' "$nour_unit" || fail 'Review the current booking flag before updating.'
[ "$(grep -c '^WorkingDirectory=' "$nour_unit")" = 1 ] || fail 'Unexpected WorkingDirectory configuration.'
[ "$(grep -c '^ExecStart=' "$nour_unit")" = 1 ] || fail 'Unexpected ExecStart configuration.'
[ -z "$(ss -H -ltn 'sport = :3101')" ] || fail 'Preview port 3101 is already in use.'
nginx -t

install -d -m 700 /root/nour-website-backups
nour_backup=$(mktemp -d /root/nour-website-backups/release-XXXXXXXX)
cp -a "$nour_unit" "$nour_backup/nour-website.service"
nour_preview="nour-website-preview-${nour_expected:0:12}-$$.service"
nour_preview_started=0
nour_switched=0

cleanup() {
  local nour_status=$?
  trap - EXIT
  if [ "$nour_preview_started" = 1 ]; then
    systemctl stop "$nour_preview" || true
  fi
  if [ "$nour_status" -ne 0 ] && [ "$nour_switched" = 1 ]; then
    printf '%s\n' 'Restoring the previous service definition.'
    if install -m 644 "$nour_backup/nour-website.service" "$nour_unit" \
      && systemctl daemon-reload \
      && systemctl restart "$nour_service" \
      && wait_for_home http://127.0.0.1:3100; then
      printf 'PREVIOUS_RELEASE_RESTORED=%s\n' "$nour_previous"
    else
      printf '%s\n' 'ROLLBACK_NEEDS_ATTENTION: inspect the service logs.' >&2
    fi
  fi
  if [ "$nour_status" -ne 0 ]; then
    printf 'DEPLOY_FAILED=%s\nBACKUP=%s\n' "$nour_status" "$nour_backup" >&2
  fi
  exit "$nour_status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

install -o nourapp -g nourapp -m 600 "$nour_previous/.env.local" "$nour_release/.env.local"
runuser -u nourapp -- env \
  PATH="$nour_runtime:/usr/local/bin:/usr/bin:/bin" \
  NEXT_PUBLIC_SITE_URL=https://nourappglobal.com \
  NEXT_PUBLIC_WEBSITE_BOOKING_ENABLED=false \
  NEXT_TELEMETRY_DISABLED=1 \
  bash -c '
    set -euo pipefail
    cd -- "$1"
    npm ci
    npm run quality
    npm test
    nice -n 10 env NODE_OPTIONS=--max-old-space-size=3072 npm run build -- --webpack
    test -s .next/BUILD_ID
  ' _ "$nour_release"

nour_preview_started=1
systemd-run --quiet --unit="$nour_preview" \
  --property=User=nourapp --property=Group=nourapp \
  --property="WorkingDirectory=$nour_release" \
  --property=NoNewPrivileges=true --property=UMask=0077 \
  --setenv=NODE_ENV=production --setenv=NEXT_PUBLIC_WEBSITE_BOOKING_ENABLED=false \
  --setenv="PATH=$nour_runtime:/usr/local/bin:/usr/bin:/bin" \
  "$nour_runtime/node" "$nour_release/node_modules/next/dist/bin/next" start --hostname 127.0.0.1 --port 3101
wait_for_home() {
  local nour_base=$1 nour_attempt
  for nour_attempt in {1..30}; do
    if curl --noproxy '*' -fsS --max-time 5 -o /dev/null "$nour_base/"; then return 0; fi
    sleep 1
  done
  return 1
}

check_site() {
  local nour_base=$1 nour_label=$2 nour_asset nour_http
  curl --noproxy '*' -fsS --max-time 30 "$nour_base/" -o "$nour_backup/$nour_label.html"
  nour_asset=$("$nour_runtime/node" -e '
    const html=require("node:fs").readFileSync(process.argv[1],"utf8");
    const paths=[...html.matchAll(/src="(\/_next\/static\/[^"<>]+\.js)"/g)];
    if(!paths.length) process.exit(1);
    require("node:fs").writeFileSync(process.argv[2],JSON.stringify([...new Set(paths.map(match=>match[1]))].sort()));
    process.stdout.write(paths[paths.length-1][1]);
  ' "$nour_backup/$nour_label.html" "$nour_backup/$nour_label-scripts.json")
  curl --noproxy '*' -fsS --max-time 30 -o /dev/null "$nour_base$nour_asset"
  nour_http=$(curl --noproxy '*' -sS --max-time 30 -X POST \
    -H 'Content-Type: application/json' --data '{}' \
    -o "$nour_backup/$nour_label-booking.json" -w '%{http_code}' "$nour_base/api/bookings")
  [ "$nour_http" = 503 ] || return 1
  "$nour_runtime/node" -e '
    const value=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"));
    if(value.code!=="website_booking_paused") process.exit(1);
  ' "$nour_backup/$nour_label-booking.json"
}

wait_for_home http://127.0.0.1:3101
systemctl is-active --quiet "$nour_preview"
check_site http://127.0.0.1:3101 preview
systemctl stop "$nour_preview"
nour_preview_started=0
cmp -s "$nour_unit" "$nour_backup/nour-website.service" || fail 'The active service configuration changed during the build.'

awk -v release="$nour_release" -v runtime="$nour_runtime" '
  /^WorkingDirectory=/ { print "WorkingDirectory=" release; next }
  /^ExecStart=/ { print "ExecStart=" runtime "/node " release "/node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100"; next }
  { print }
' "$nour_backup/nour-website.service" > "$nour_backup/new.service"
nour_switched=1
install -m 644 "$nour_backup/new.service" "$nour_unit"
systemctl daemon-reload
systemctl restart "$nour_service"
wait_for_home http://127.0.0.1:3100
check_site http://127.0.0.1:3100 internal
check_site https://nourappglobal.com public
cmp -s "$nour_backup/preview-scripts.json" "$nour_backup/public-scripts.json" || fail 'The public domain is not serving the candidate assets.'
systemctl is-active --quiet "$nour_service"
printf 'NOUR_UPDATE_READY\nCOMMIT=%s\nRELEASE=%s\nBACKUP=%s\nBOOKING_HTTP=503\n' "$nour_expected" "$nour_release" "$nour_backup"
