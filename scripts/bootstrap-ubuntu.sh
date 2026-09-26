#!/usr/bin/env bash
set -euo pipefail
# Uses the operator's SSH configuration. No credentials or provider IPs are inputs.
usage() { echo 'Usage: scripts/bootstrap-ubuntu.sh SSH_ALIAS [EXACT_COMMIT] [--preflight-only]' >&2; exit 2; }
[[ $# -ge 1 && $# -le 3 ]] || usage
ssh_target=$1
[[ $ssh_target =~ ^[a-zA-Z0-9][a-zA-Z0-9._-]*$ ]] || usage
repo_root=$(cd "$(dirname "$0")/.." && pwd)
revision=${2:-$(git -C "$repo_root" rev-parse HEAD)}
mode=${3:-install}
[[ $revision =~ ^[0-9a-f]{40}$ ]] || usage
[[ $mode == install || $mode == --preflight-only ]] || usage
# No agent forwarding; known-host verification and SSH auth remain normal OpenSSH policy.
ssh -o BatchMode=yes -o ForwardAgent=no -o ConnectTimeout=15 "$ssh_target" \
  "sudo -n bash -s -- '$revision' '$mode'" < "$repo_root/scripts/bootstrap-ubuntu-host.sh"
printf 'UI tunnel: ssh -N -L 4310:127.0.0.1:4310 %s\n' "$ssh_target"
printf 'Open http://127.0.0.1:4310\n'
