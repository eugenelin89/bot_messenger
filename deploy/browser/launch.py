#!/usr/bin/python3
"""Trusted Playwright executable adapter. Never accept worker-supplied flags/paths.

The broker is private and non-root. Chromium gets only runtime libraries/fonts and
its own ephemeral filesystem, PID and network namespaces. CDP uses inherited pipes.
"""
import glob
import os
import sys

ROOT = "/opt/botsquad-browser"
chromes = glob.glob(ROOT + "/browsers/chromium-*/chrome-linux*/chrome")
if len(chromes) != 1 or os.geteuid() == 0:
    raise SystemExit("Exactly one managed Chromium and a non-root browser identity required")
flags = sys.argv[1:]
if "--no-sandbox" in flags or "--remote-debugging-pipe" not in flags:
    raise SystemExit("Chromium sandbox and pipe transport are required")
if any(x.startswith(("--remote-debugging-port", "--load-extension", "--disable-setuid-sandbox")) for x in flags):
    raise SystemExit("Unsupported browser launch flag")
flags = [x for x in flags if not x.startswith("--user-data-dir=")]
flags += ["--user-data-dir=/home/browser/profile", "--disable-dev-shm-usage"]
args = [ROOT + "/bwrap", "--unshare-all", "--die-with-parent", "--new-session",
        "--cap-drop", "ALL", "--clearenv",
        "--ro-bind", os.path.dirname(chromes[0]), "/opt/chromium",
        "--proc", "/proc", "--dev", "/dev",
        "--size", "134217728", "--tmpfs", "/tmp",
        "--size", "134217728", "--tmpfs", "/home/browser",
        "--dir", "/home/browser/profile", "--dir", "/run"]
mounted = set()
for path in ("/lib", "/lib64", "/usr/lib", "/usr/lib64"):
    if not os.path.exists(path):
        continue
    canonical = os.path.realpath(path)
    if canonical not in mounted:
        args += ["--ro-bind", canonical, canonical]
        mounted.add(canonical)
    if path != canonical:
        args += ["--symlink", canonical, path]
for path in ("/usr/share/fonts", "/usr/share/fontconfig", "/etc/fonts", "/etc/localtime"):
    if os.path.exists(path):
        args += ["--ro-bind", path, path]
args += ["--remount-ro", "/", "--chdir", "/home/browser", "--setenv", "HOME", "/home/browser",
         "--setenv", "LANG", "C.UTF-8", "--setenv", "TZ", "UTC", "--",
         "/opt/chromium/chrome", *flags]
os.execv(args[0], args)
