# Set Up a Minimal Ubuntu Host for BotSquad

**Status:** Pre-bootstrap operator guide  
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

After that, the checked-in BotSquad bootstrap prompt should perform the BotSquad-specific setup.

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

Sizing based on Prompt 03 acceptance:

| Use | Suggested starting size |
| --- | --- |
| Smallest validated light-duty configuration | 1 vCPU, 2 GB RAM, 50 GB SSD + 2 GB swap |
| Comfortable small-team starting point | 2 vCPU, 4 GB RAM, 40+ GB SSD |
| More concurrent engineering/build work | 4+ vCPU, 8+ GB RAM |

The first row passed real Prompt 03 research and six-worker SquadStatus engineering with the normal two-execution limit: 146 seconds for engineering, 24.96 seconds of overlapping engineer turns, at least 1.42 GiB available RAM and no swap use. It is the smallest configuration actually validated, not a guarantee for larger repositories/builds or sustained workloads. Larger rows remain planning recommendations. See [measured evidence](../validation/prompt-03-ubuntu.md).

Bootstrap still inspects each actual host; provider branding does not establish compatibility.

Idle workers do not continuously consume model execution or CPU, so do not buy a large machine merely because BotSquad can remember many workers.

## 2. Use a supported Ubuntu release

Choose a current Ubuntu LTS image unless BotSquad documentation explicitly lists another validated release.

For the first Prompt 03 acceptance host, use the Ubuntu LTS version selected by that implementation and record its exact version.

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

The planned BotSquad Ubuntu architecture keeps the UI on:

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

The alias is the only server identifier the future BotSquad bootstrap prompt should need.

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

## 9. Run the BotSquad bootstrap prompt

After Prompt 03 implements it, open:

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

## 10. Open the BotSquad UI

BotSquad should not initially expose its UI directly to the Internet.

From your local computer:

    ssh -L 4310:127.0.0.1:4310 botsquad-hq

or:

    ssh -L 4310:127.0.0.1:4310 botsquad

Leave that SSH connection open.

Then browse to:

    http://127.0.0.1:4310

The browser connection is forwarded securely to BotSquad on the Ubuntu host.

## 11. Minimum readiness checklist

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

For the planned architecture and acceptance requirements, see:

- [Ubuntu HQ and Bootstrap Model](../product/UBUNTU_HQ_AND_BOOTSTRAP.md)
- [Decision 009](../decisions/decision_009_ubuntu_bootstrap.md)
