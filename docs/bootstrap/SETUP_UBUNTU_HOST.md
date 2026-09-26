# Set Up a Minimal Ubuntu Host for BotSquad

**Status:** Current Ubuntu host-preparation guide; validated through Prompt 04  
**Audience:** Anyone preparing a machine for the BotSquad Ubuntu bootstrap prompt

## Goal

You do not need to manually install BotSquad, Node.js, Codex, systemd, Linux worker accounts, or BotSquad sandboxing.

Before running the BotSquad Ubuntu bootstrap prompt, you only need:

1. a supported Ubuntu machine;
2. network access to it;
3. an SSH account with enough privilege to bootstrap it;
4. a local SSH alias that works without putting private-key material into BotSquad.

The finish line for this guide is simply:

    ssh my-botsquad-server

opens a shell on the Ubuntu machine.

After that, the checked-in BotSquad bootstrap prompt performs the BotSquad-specific setup.

## This can be any Ubuntu machine

The host does not have to be DigitalOcean.

Suitable examples include:

- a DigitalOcean Droplet;
- an AWS EC2 instance;
- a Hetzner cloud server;
- an Azure or Google Cloud VM;
- another VPS provider;
- a virtual machine on your own server;
- a physical Ubuntu computer on your network;
- a dedicated Ubuntu box in a data centre.

The requirement is provider-neutral:

> A supported Ubuntu host must be reachable from the computer running Codex using a normal SSH command.

For example:

    ssh botsquad-hq

DigitalOcean is only the worked example in this guide.

## 1. Choose a machine size

BotSquad itself is small, but real Codex workers, Git repositories, builds, and tests need CPU and RAM.

Sizing based on the current Prompt 03/04 acceptance evidence:

| Use | Suggested starting size |
| --- | --- |
| Smallest validated light-duty configuration | 1 vCPU, 2 GB RAM, 50 GB SSD + 2 GB swap |
| Comfortable small-team starting point | 2 vCPU, 4 GB RAM, 40+ GB SSD |
| More concurrent engineering/build work | 4+ vCPU, 8+ GB RAM |

The first row passed the real Prompt 03 research/six-worker engineering workload and remained viable through Prompt 04's Nix, approval, worker-identity, independent-clone, retirement and reboot acceptance. Prompt 04 still observed at least about 1.39 GiB available memory during the bounded validation window, while the provisioner added only modest idle overhead. It remains the smallest configuration actually validated, not a guarantee for larger repositories/builds or sustained workloads. Larger rows remain planning recommendations. See the [Prompt 03 measurements](../validation/prompt-03-ubuntu.md) and [Prompt 04 validation](../validation/prompt-04-linux-identity.md).

Bootstrap still inspects each actual host; provider branding does not establish compatibility.

Idle workers do not continuously consume model execution or CPU, so do not buy a large machine merely because BotSquad can remember many workers.

## 2. Use a supported Ubuntu release

BotSquad's currently certified Linux deployment is **Ubuntu 24.04 LTS on x86_64**.

Use Ubuntu 24.04 x86_64 for a new BotSquad HQ unless newer project documentation explicitly expands the supported contract.

Prefer a fresh VM.

Avoid using the first BotSquad HQ on:

- a heavily customized production server;
- a machine hosting unrelated important workloads;
- an unknown Linux distribution;
- a machine where you cannot safely grant temporary bootstrap privileges.

## 3. Create or reuse an SSH key

BotSquad should use your normal SSH client configuration.

It must never need your private SSH key copied into a prompt or repository.

On macOS or Linux, check for existing public keys:

    ls ~/.ssh/*.pub

Common files are:

    ~/.ssh/id_ed25519
    ~/.ssh/id_ed25519.pub

The file ending in .pub is the public key.

The file without .pub is the private key.

Never paste or commit the private key.

If you do not already have a suitable key:

    ssh-keygen -t ed25519

Follow the prompts. A passphrase is recommended for a personal SSH key.

## 4. DigitalOcean example

The following is a worked example only. Other providers are fine.

### Create the Droplet

In the DigitalOcean Control Panel:

1. Choose Create → Droplets.
2. Select a current Ubuntu LTS image.
3. Choose a region reasonably close to you.
4. Choose a machine size.
5. Select SSH Key authentication.
6. Add or select your public SSH key.
7. Enable monitoring if desired.
8. Enable backups if you want automatic recovery points.
9. Give the server a recognizable name, for example:

       botsquad-hq

10. Create the Droplet.

DigitalOcean displays its public IP after creation.

DigitalOcean currently recommends SSH-key authentication, a sudo non-root administrative user for normal administration, backups/monitoring, and a cloud firewall that restricts inbound access. Official references:

- https://docs.digitalocean.com/products/droplets/getting-started/recommended-droplet-setup/
- https://docs.digitalocean.com/products/droplets/how-to/create/
- https://docs.digitalocean.com/products/droplets/how-to/connect-with-ssh/

### Firewall

For initial BotSquad setup, inbound access normally needs only:

    TCP 22 — SSH

Do not expose BotSquad port 4310 publicly.

The validated BotSquad Ubuntu deployment keeps the UI on:

    127.0.0.1:4310

and reaches it through an SSH tunnel.

If your local public IP is stable, you may restrict SSH to that source IP. Keep a recovery path in mind before tightening firewall rules.

## 5. Verify the first SSH login

A fresh DigitalOcean Ubuntu Droplet commonly allows the initial SSH key to log in as root.

Example:

    ssh root@203.0.113.10

Replace the example address with the real Droplet IP.

On first connection, SSH may ask you to verify the host key. Verify the expected server and accept it as appropriate.

Once connected:

    whoami
    hostname
    cat /etc/os-release
    uname -m

Then:

    exit

Some providers create a non-root administrative account instead. That is also fine as long as it can perform the bootstrap through sudo.

## 6. Create a friendly local SSH alias

The alias is the only server identifier the BotSquad bootstrap prompt should need.

Open or create:

    ~/.ssh/config

Example:

    Host botsquad-hq
        HostName 203.0.113.10
        User root
        IdentityFile ~/.ssh/id_ed25519

Another equally valid alias is simply:

    Host botsquad
        HostName 203.0.113.10
        User root
        IdentityFile ~/.ssh/id_ed25519

The exact alias is your choice.

Protect your SSH directory/config:

    chmod 700 ~/.ssh
    chmod 600 ~/.ssh/config

The IdentityFile line is optional if your SSH agent or default SSH configuration already selects the right key.

## 7. Verify the one command BotSquad needs

Run:

    ssh botsquad-hq

or:

    ssh botsquad

You should get a shell without providing BotSquad or Codex the private key.

Inside the host, it is useful to confirm:

    whoami
    hostname
    cat /etc/os-release
    uname -m
    df -h /
    free -h
    nproc

Then:

    exit

If the SSH alias reliably opens the expected Ubuntu machine, the host is ready for the BotSquad bootstrap prompt.

## 8. What you do NOT need to install manually

Before the BotSquad bootstrap prompt, do not manually configure these unless troubleshooting specifically requires it:

- BotSquad;
- the BotSquad Git checkout;
- Node.js/npm;
- Codex CLI;
- BotSquad systemd service;
- BotSquad service user;
- BotSquad data directories;
- bot Linux users;
- Nix;
- product Git repositories;
- Linux sandboxing;
- BotSquad database;
- public web hosting for BotSquad.

The bootstrap process should own these steps.

This makes installations reproducible and supportable.

## 9. Clone BotSquad on your workstation

You need a local checkout because the checked-in Codex prompt and reproducible installer
live in the repository:

    git clone https://github.com/eugenelin89/bot_messenger.git
    cd bot_messenger
    git fetch origin

The checkout stays on your workstation during initial bootstrap. Codex uses your normal
SSH configuration to configure the remote Ubuntu machine.

## 10. Run the BotSquad bootstrap prompt

From your local BotSquad checkout, open:

    prompts/bootstrap-ubuntu.md

Set the SSH target near the top, for example:

    SSH_TARGET=botsquad-hq

or:

    SSH_TARGET=botsquad

Then run that prompt in Codex.

The bootstrap should:

1. verify local Git and SSH;
2. verify SSH to the target;
3. inspect the Ubuntu host before mutating it;
4. report the planned changes and ETA;
5. run the checked-in reproducible bootstrap;
6. install/update BotSquad;
7. install/validate Codex;
8. configure a non-root BotSquad systemd service;
9. configure persistent data outside the source checkout;
10. validate Linux isolation;
11. start and test BotSquad;
12. validate restart/reboot behavior;
13. run the bootstrap a second time to verify idempotency;
14. print the SSH tunnel command.

If official Codex login/device authorization requires human interaction, complete that one-time login when prompted.

## 11. Complete the one-time Codex login

The bootstrap will tell you when the Ubuntu `botsquad` service account needs its
ChatGPT/Codex authorization.

Generic command:

    ssh -t botsquad-hq 'sudo -u botsquad env HOME=/var/lib/botsquad CODEX_HOME=/var/lib/botsquad/.codex PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin /opt/botsquad/node_modules/.bin/codex login --device-auth'

Replace `botsquad-hq` with your SSH alias.

Complete the browser authorization privately.

If ChatGPT rejects device-code sign-in, enable the available device-code authentication
setting in ChatGPT Security settings, or ask the relevant workspace administrator to
enable device-code authentication.

Never share a device code or paste it into an issue/chat; device codes can be phished.

Then continue the bootstrap/validation instructions.

## 12. Open the BotSquad UI

BotSquad should not initially expose its UI directly to the Internet.

From your local computer:

    ssh -L 4310:127.0.0.1:4310 botsquad-hq

or:

    ssh -L 4310:127.0.0.1:4310 botsquad

Leave that SSH connection open.

Then browse to:

    http://127.0.0.1:4310

The browser connection is forwarded securely to BotSquad on the Ubuntu host.

## 13. Minimum readiness checklist

Before starting the bootstrap prompt:

- [ ] Ubuntu machine exists.
- [ ] It is safe/intended for BotSquad to configure.
- [ ] You know its IP or hostname.
- [ ] SSH-key authentication works.
- [ ] You have a local SSH alias.
- [ ] ssh <alias> opens a shell.
- [ ] The SSH user is root or can use sudo for bootstrap.
- [ ] The machine has outbound Internet access for installation.
- [ ] BotSquad port 4310 is not publicly exposed.
- [ ] You have a provider recovery path, snapshot, or backup appropriate to the machine.

That is enough.

## Provider-neutral mental model

BotSquad should see only:

    SSH_TARGET
        |
        v
    supported Ubuntu machine

The machine may be hosted by:

- DigitalOcean;
- AWS;
- Hetzner;
- Azure;
- Google Cloud;
- another VPS provider;
- your own hypervisor;
- your own physical hardware.

Future cloud-provider integrations may create machines automatically. That is not required for the first Ubuntu bootstrap.

## Troubleshooting

### SSH alias does not work

Run:

    ssh -v botsquad-hq

Fix initial SSH access before running the BotSquad bootstrap.

The bootstrap prompt should not try to recover an unknown/broken initial SSH configuration.

### Permission denied

Check:

- SSH username;
- public key installed on the server;
- private key selected by your SSH client/agent;
- local ~/.ssh permissions.

Do not solve this by pasting a private key into a Codex prompt.

### Host-key changed warning

Do not blindly remove the warning.

First determine whether:

- you intentionally rebuilt/replaced the server;
- the provider reused an IP;
- you are connecting to the correct machine.

Update known_hosts only after confirming the reason.

### BotSquad UI is unreachable after bootstrap

First ensure the SSH tunnel is still open.

Then inspect remotely:

    systemctl status botsquad
    ss -ltn

The expected BotSquad service should listen on loopback rather than a public address.

## Security principles

1. Private SSH keys stay with the user's SSH client.
2. BotSquad itself runs non-root.
3. Root/sudo is used only for bounded installation/system operations.
4. The BotSquad UI is loopback-only initially.
5. A fresh Ubuntu host is preferred over an unrelated production server.
6. Bootstrap inspects before mutating.
7. Unsupported or ambiguous host state fails closed.
8. Installation should be reproducible and idempotent.
9. BotSquad-specific setup belongs to the bootstrap, not undocumented manual steps.

For the implemented architecture, operations, and acceptance evidence, see:

- [Ubuntu HQ and Bootstrap Model](../product/UBUNTU_HQ_AND_BOOTSTRAP.md)
- [Decision 009](../decisions/decision_009_ubuntu_bootstrap.md)
- [Access and Operations](../operations/ACCESS_AND_OPERATIONS.md)
- [Current State](../operations/CURRENT_STATE.md)
- [Prompt 04 validation](../validation/prompt-04-linux-identity.md)
- [Prompt 03 historical Ubuntu validation](../validation/prompt-03-ubuntu.md)


## Next documents

- [Ubuntu HQ Bootstrap](UBUNTU_BOOTSTRAP.md)
- [Access and Operations](../operations/ACCESS_AND_OPERATIONS.md)
- [Current State](../operations/CURRENT_STATE.md)
