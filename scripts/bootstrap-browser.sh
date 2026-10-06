#!/usr/bin/env bash
# Narrow, repeatable optional browser runtime installation. No OS upgrade or desktop.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Root installer required' >&2; exit 1; }
. /etc/os-release
[[ $ID == ubuntu && $VERSION_ID == 24.04 && $(uname -m) == x86_64 ]] || exit 1
source_dir=$(cd -- "$(dirname -- "$0")/.." && pwd -P)
mode=${1:---runtime-only}
[[ $mode == --runtime-only || $mode == --service ]] || exit 2
export PATH=/opt/botsquad-runtime/node/bin:/usr/sbin:/usr/bin:/sbin:/bin
[[ $(node -p "require('$source_dir/node_modules/playwright-core/package.json').version") == 1.63.0 ]] || exit 1
exec 9>/run/lock/botsquad-browser-bootstrap.lock
flock -n 9 || { echo 'Browser installation already active' >&2; exit 1; }
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=l
apt-get -o DPkg::Lock::Timeout=180 update
apt-get -o DPkg::Lock::Timeout=180 install -y --no-install-recommends \
  libnss3 libnspr4 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libasound2t64 libatspi2.0-0t64 libcairo2 libpango-1.0-0 fonts-liberation bubblewrap apparmor
if ! getent passwd botsquad-browser >/dev/null; then
  useradd --system --user-group --home-dir /nonexistent --shell /usr/sbin/nologin botsquad-browser
fi
[[ $(id -u botsquad-browser) != 0 && $(getent passwd botsquad-browser | cut -d: -f6) == /nonexistent ]] || exit 1
install -d -o root -g root -m 755 /opt/botsquad-browser /opt/botsquad-browser/browsers
export PLAYWRIGHT_BROWSERS_PATH=/opt/botsquad-browser/browsers
node "$source_dir/node_modules/playwright-core/cli.js" install --no-shell chromium
install -o root -g botsquad-browser -m 750 /usr/bin/bwrap /opt/botsquad-browser/bwrap
install -o root -g botsquad-browser -m 750 "$source_dir/deploy/browser/launch.py" /opt/botsquad-browser/launch.py
install -o root -g root -m 644 "$source_dir/deploy/apparmor/botsquad-browser-bwrap" /etc/apparmor.d/botsquad-browser-bwrap
apparmor_parser -r /etc/apparmor.d/botsquad-browser-bwrap
chmod -R go-w /opt/botsquad-browser
if [[ $mode == --service ]]; then
  [[ -f "$source_dir/dist/src/computer/broker.js" && $source_dir == /opt/botsquad ]] || { echo 'Service installation requires the exact built deployment' >&2; exit 1; }
  install -d -o botsquad-browser -g botsquad -m 2750 /run/botsquad-browser
  printf 'd /run/botsquad-browser 2750 botsquad-browser botsquad -\n' > /etc/tmpfiles.d/botsquad-browser.conf
  install -o root -g root -m 644 "$source_dir/deploy/systemd/botsquad-browser.service" /etc/systemd/system/botsquad-browser.service
  systemctl daemon-reload
  systemctl enable botsquad-browser.service
  systemctl restart botsquad-browser.service
fi
echo 'Bounded Chromium runtime installed; no session or grant created.'
