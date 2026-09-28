#!/usr/bin/python3
"""Non-root, trusted service Git resource wrapper. No worker entrypoint."""
import os
import resource
import sys

resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
resource.setrlimit(resource.RLIMIT_FSIZE, (16 * 1024 * 1024, 16 * 1024 * 1024))
resource.setrlimit(resource.RLIMIT_CPU, (25, 30))
if sys.platform == 'linux':
    resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))
resource.setrlimit(resource.RLIMIT_NOFILE, (128, 128))
os.execve('/usr/bin/git', ['/usr/bin/git', *sys.argv[1:]], dict(os.environ))
