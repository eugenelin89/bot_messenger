#!/usr/bin/env bash
# Invoked over SSH by bootstrap-ubuntu.sh; do not run from an untrusted download.
set -euo pipefail
export LC_ALL=C
[[ $EUID -eq 0 ]] || { echo 'Bootstrap requires root or passwordless sudo' >&2; exit 1; }
revision=${1:?exact commit required}
mode=${2:-install}
[[ $revision =~ ^[0-9a-f]{40}$ ]] || exit 2
. /etc/os-release
[[ $ID == ubuntu && $VERSION_ID == 24.04 && $(uname -m) == x86_64 ]] || { echo 'Supported target: Ubuntu 24.04 x86_64' >&2; exit 1; }
# Read-only preflight before any system mutation.
id; uname -srmo; nproc; free -h; df -h /; swapon --show
ss -ltn; systemctl --failed --no-pager
[[ -z $(dpkg --audit) ]] || { echo 'Resolve existing dpkg problems before bootstrap' >&2; exit 1; }
apt-get -s upgrade | tail -n 3
if getent passwd botsquad >/dev/null; then
  [[ $(getent passwd botsquad | cut -d: -f6) == /var/lib/botsquad && $(id -u botsquad) != 0 ]] || { echo 'Existing botsquad account conflicts with service layout' >&2; exit 1; }
fi
if [[ -e /opt/botsquad ]]; then
  [[ -d /opt/botsquad/.git && ! -L /opt/botsquad ]] || { echo 'Existing /opt/botsquad is not the managed checkout' >&2; exit 1; }
  [[ -z $(git -C /opt/botsquad status --porcelain) ]] || { echo 'Preserve dirty deployment; inspect before updating' >&2; exit 1; }
  [[ $(git -C /opt/botsquad remote get-url origin) == https://github.com/eugenelin89/bot_messenger.git ]] || { echo 'Unexpected deployment remote' >&2; exit 1; }
fi
if [[ -e /etc/systemd/system/botsquad.service ]]; then
  [[ -f /etc/botsquad/bootstrap-managed ]] || { echo 'Existing unmanaged service; inspect before replacing' >&2; exit 1; }
fi
if [[ -e /var/lib/botsquad && ! -f /etc/botsquad/bootstrap-managed ]]; then
  echo 'Existing unmanaged data directory; inspect before bootstrap' >&2; exit 1
fi
if [[ $mode == --preflight-only ]]; then exit 0; fi
exec 9>/run/lock/botsquad-bootstrap.lock
flock -n 9 || { echo 'Another BotSquad bootstrap is active' >&2; exit 1; }
echo 'Installing updates, runtime, service account, persistent swap and loopback service'
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a
apt-get -o DPkg::Lock::Timeout=180 update
# No removals, no release upgrade, preserve existing operator configuration (including SSH).
apt-get -o DPkg::Lock::Timeout=180 -o Dpkg::Options::=--force-confold --no-remove -y upgrade --with-new-pkgs
apt-get -o DPkg::Lock::Timeout=180 -y install --no-install-recommends ca-certificates curl xz-utils git bubblewrap apparmor util-linux
[[ -z $(dpkg --audit) ]] || { echo 'Package health check failed' >&2; exit 1; }

install -d -m 755 /opt/botsquad-runtime /etc/botsquad
node_version=24.21.0
node_sha=fd8e59d5a511510f6a298afb548f18c7d2b1be404d8b4a27d94fbe49f56cb2d6
node_dir=/opt/botsquad-runtime/node-v${node_version}-linux-x64
if [[ ! -x $node_dir/bin/node ]]; then
  temp_dir=$(mktemp -d)
  trap 'rm -rf "$temp_dir"' EXIT
  curl --fail --silent --show-error --proto '=https' --tlsv1.2 "https://nodejs.org/dist/v${node_version}/node-v${node_version}-linux-x64.tar.xz" -o "$temp_dir/node.tar.xz"
  printf '%s  %s\n' "$node_sha" "$temp_dir/node.tar.xz" | sha256sum --check --status
  tar -xJf "$temp_dir/node.tar.xz" -C /opt/botsquad-runtime
  rm -rf "$temp_dir"; trap - EXIT
fi
[[ $($node_dir/bin/node --version) == v${node_version} ]] || exit 1
ln -sfn "$node_dir" /opt/botsquad-runtime/node
export PATH=/opt/botsquad-runtime/node/bin:/usr/sbin:/usr/bin:/sbin:/bin
if ! getent passwd botsquad >/dev/null; then
  useradd --system --user-group --home-dir /var/lib/botsquad --shell /usr/sbin/nologin botsquad
fi
install -d -o botsquad -g botsquad -m 700 /var/lib/botsquad
install -d -o botsquad -g botsquad -m 700 /var/lib/botsquad/.codex
install -m 600 /dev/null /etc/botsquad/bootstrap-managed

# Adopt only our own swap file; never resize or overwrite an existing unrelated file.
if [[ $(awk '/SwapTotal/ {print $2}' /proc/meminfo) -lt 1048576 ]]; then
  if [[ -e /swapfile-botsquad ]]; then
    [[ -f /etc/botsquad/swap-managed && ! -L /swapfile-botsquad && $(stat -c %s /swapfile-botsquad) == 2147483648 ]] || { echo 'Existing swap path conflicts' >&2; exit 1; }
  else
    [[ $(df -Pk / | awk 'NR==2 {print $4}') -gt 4194304 ]] || { echo 'Not enough free disk for swap' >&2; exit 1; }
    (umask 077; fallocate -l 2G /swapfile-botsquad)
    chmod 600 /swapfile-botsquad
    mkswap /swapfile-botsquad
    install -m 600 /dev/null /etc/botsquad/swap-managed
  fi
  swapon --show=NAME --noheadings | grep -Fxq /swapfile-botsquad || swapon /swapfile-botsquad
  grep -Eq '^/swapfile-botsquad[[:space:]]' /etc/fstab || printf '/swapfile-botsquad none swap sw 0 0\n' >> /etc/fstab
fi

if [[ ! -d /opt/botsquad/.git ]]; then git clone https://github.com/eugenelin89/bot_messenger.git /opt/botsquad; fi
git -C /opt/botsquad fetch origin
git -C /opt/botsquad cat-file -e "${revision}^{commit}"
git -C /opt/botsquad merge-base --is-ancestor HEAD "$revision" || { echo 'Requested update does not preserve deployed history' >&2; exit 1; }
# Never replace dependencies or build files beneath a running dispatcher.
# Graceful shutdown retains interrupted work for inspection; it does not replay it.
if systemctl is-active --quiet botsquad.service; then systemctl stop botsquad.service; fi
git -C /opt/botsquad checkout --detach "$revision"
cd /opt/botsquad
npm ci --ignore-scripts --no-audit --no-fund
npm run build
chmod -R go-w /opt/botsquad
# A service-only copy receives userns admission; global Ubuntu restrictions stay on.
# Never overwrite a separately administered policy with this name.
if [[ -e /etc/apparmor.d/botsquad-bwrap && ! -f /etc/botsquad/apparmor-managed ]]; then
  echo 'Existing unmanaged BotSquad AppArmor profile; inspect before replacing' >&2; exit 1
fi
install -o root -g botsquad -m 750 /usr/bin/bwrap /opt/botsquad-runtime/bwrap
install -m 644 deploy/apparmor/botsquad-bwrap /etc/apparmor.d/botsquad-bwrap
apparmor_parser -r /etc/apparmor.d/botsquad-bwrap
install -m 600 /dev/null /etc/botsquad/apparmor-managed
runuser -u botsquad -- /opt/botsquad-runtime/bwrap --unshare-all --ro-bind / / -- /usr/bin/true
install -m 644 deploy/systemd/botsquad.service /etc/systemd/system/botsquad.service
# Preserve operator overrides on update. Default file contains no secrets.
if [[ ! -e /etc/botsquad/environment ]]; then
  printf '# Optional BOT_MODEL runtime default; UI per-worker settings take precedence.\n' > /etc/botsquad/environment
  chmod 600 /etc/botsquad/environment
fi
printf 'BOT_DEPLOYED_SHA=%s\n' "$revision" > /etc/botsquad/deployment
chmod 600 /etc/botsquad/deployment
systemctl daemon-reload
# Gate startup on the actual service restrictions, not only a runuser shell.
bash scripts/validate-ubuntu-host.sh deterministic --wait
systemctl enable botsquad.service
systemctl restart botsquad.service
for attempt in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:4310/api/health; then break; fi
  [[ $attempt -lt 30 ]] || { systemctl status botsquad.service --no-pager; exit 1; }
  sleep 1
done
systemctl is-active botsquad.service
systemctl is-enabled botsquad.service
[[ $(systemctl show -p User --value botsquad.service) == botsquad ]]
ss -ltnp '( sport = :4310 )'
[[ $(ss -H -ltn '( sport = :4310 )' | awk '{print $4}') == 127.0.0.1:4310 ]] || { echo 'Unexpected UI listener' >&2; exit 1; }
node --version
runuser -u botsquad -- env HOME=/var/lib/botsquad CODEX_HOME=/var/lib/botsquad/.codex PATH="$PATH" /opt/botsquad/node_modules/.bin/codex --version
if ! runuser -u botsquad -- env HOME=/var/lib/botsquad CODEX_HOME=/var/lib/botsquad/.codex PATH="$PATH" /opt/botsquad/node_modules/.bin/codex login status; then
  echo 'Service is installed; Codex login is required under botsquad before real worker acceptance.'
fi
printf 'Deployed commit: %s\n' "$(git rev-parse HEAD)"
free -h; swapon --show
