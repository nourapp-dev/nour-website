#!/usr/bin/env bash
# Read-only host inventory. Does not install packages or alter services/files.
# Run in the Hostinger console; it deliberately avoids environment variables,
# process arguments, container inspection and application configuration files.
set -u
export LC_ALL=C

printf 'NOUR_SUPABASE_HOST_CHECK\n'
date -u '+CHECKED_AT=%Y-%m-%dT%H:%M:%SZ'
printf 'ARCHITECTURE='
uname -m
if [ -r /etc/os-release ]; then
  awk -F= '$1 == "PRETTY_NAME" { print "OS=" $2 }' /etc/os-release
fi
printf 'CPU_CORES='
nproc
free -m
df -hT / /home /var/lib
uptime

nour_cpanel_version=none
if [ -x /usr/local/cpanel/cpanel ]; then
  nour_cpanel_version=$(/usr/local/cpanel/cpanel -V)
fi
printf 'CPANEL_VERSION=%s\n' "$nour_cpanel_version"
if command -v rpm >/dev/null 2>&1; then
  printf 'CONTAINER_PACKAGES\n'
  rpm -qa --qf '%{NAME} %{VERSION}-%{RELEASE}\n' |
    awk '$1 ~ /^(ea-podman|podman|podman-docker|docker|docker-ce|docker-ce-cli|docker-compose-plugin|containerd.io|runc|crun|conmon|buildah)$/ {print}'
fi
if command -v docker >/dev/null 2>&1; then
  printf 'DOCKER_EXECUTABLE=%s\n' "$(command -v docker)"
  timeout 10 docker --version || true
  timeout 10 docker compose version || true
  timeout 10 docker info --format 'DOCKER_SERVER={{.ServerVersion}} CGROUP={{.CgroupDriver}}' || true
else
  printf 'DOCKER_EXECUTABLE=not-installed\n'
fi
if command -v getenforce >/dev/null 2>&1; then
  printf 'SELINUX='
  getenforce
fi
printf 'RELEVANT_TCP_LISTENERS\n'
ss -H -ltnp | awk '$4 ~ /:(80|443|3100|3101|5432|6543|8000|8080|8443)$/ {print}'
printf 'TOP_MEMORY_PROCESSES_NAME_RSS_KIB\n'
ps -eo comm=,rss= --sort=-rss | head -n 8
printf 'WEBSITE_SERVICE='
systemctl is-active nour-website.service || true

nour_cpanel_major=${nour_cpanel_version%%.*}
if [[ "$nour_cpanel_major" =~ ^[0-9]+$ ]] && [ "$nour_cpanel_major" -ge 138 ]; then
  printf 'INSTALLATION_DECISION=REVIEW_REQUIRED_CPANEL_DOCKER_CONFLICT\n'
else
  printf 'INSTALLATION_DECISION=REVIEW_REQUIRED_RESOURCES_AND_COMPATIBILITY\n'
fi
printf 'NOUR_SUPABASE_HOST_CHECK_COMPLETE\n'
