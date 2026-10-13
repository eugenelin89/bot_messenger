# Supplementary read-only observations

Observed during the parent's read-only SSH inspection, approximately2026-10-13
05:57–06:08 UTC (October12 22:57–23:08 PDT). This is a sanitized transcription of
tool results, complementing the machine-generated `host-readonly.json` snapshot.
It is not a deployment or independent recovery-acceptance receipt.

| Read-only check | Actual result |
| --- | --- |
| `/etc/os-release`, `uname -r` | Ubuntu24.04.5 LTS;6.8.0-142-generic |
| Explicit installed Node binary `--version` | v24.21.0; shell PATH did not expose `node` in the first inspection |
| Installed Codex entry point `--version` | `codex-cli 0.157.0` |
| Supported `codex login status` as botsquad with existing CODEX_HOME | Exit0; classified as `chatgpt`; raw stdout/stderr suppressed; no auth.json content opened by the inspection script |
| Installed branch | Detached HEAD at `a72cee080989960d2a9e1e74d9236157ce1a0448`; clean |
| Git rev-parse as service account | Exit128; sanitized classification `dubious_ownership=true`, `permission_denied=false` |
| Loopback GET `/api/health` | alive/database/dispatcher true, runtime ready, version0.1.0, commit matches installed SHA |
| Actual HQ `/proc/<MainPID>/limits` | Core soft0, hard unlimited; not accepted0/0 |
| Kernel core pattern | Apport pipe handler configured |
| Python executable | System3.12.3; no Python3.12.12 or adapter `.venv` established |
| Service account | UID997, GID987, home `/var/lib/botsquad` |
| Browser/provisioner | `botsquad-browser.service`, `botsquad-provisioner.service` and socket active |
| Local backup inventory | Protected `/var/backups/botsquad`; prior schema-preservation/deployment snapshots and operator scripts present |
| Historical backup tested | `/var/backups/botsquad/personal04-nix-20261008-production/production-state.tar.gz`,70602867bytes; `gzip -t` exit0 |
| Historical archive SHA-256 | `0707af4567bdad20efbebc35796abe29001486fb7605628d04c37b602ac7ebb2` |
| Local timer/cron inspection | Standard OS/provider-agent timers; no obvious named BotSquad backup timer or matching backup cron filename identified |

The historical archive was hashed/tested without extraction or credential display.
Readability is not an independently verified restore, independent backup custody or
proof of current data coverage. Cloud snapshots/backups and custom differently named
jobs remain unverified. No backup was created and no service/DB/configuration changed.

Authentication mode does not establish current plan, account/routing identity, credit
balance, provider retention, reload-OFF or finite-runtime compatibility. No app-server
was launched for model/account discovery, no token refresh/login occurred, and no
genuine employee turn or Yahoo request was made. A future approved isolated preflight
must establish the remaining facts. CLI status is not fresh online model eligibility.
