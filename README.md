[![Build](https://github.com/matuscvengros/pirack-control/actions/workflows/build.yml/badge.svg)](https://github.com/matuscvengros/pirack-control/actions/workflows/build.yml)
[![Release](https://github.com/matuscvengros/pirack-control/actions/workflows/release.yml/badge.svg)](https://github.com/matuscvengros/pirack-control/actions/workflows/release.yml)
![Docker](https://img.shields.io/badge/docker-node%3A24--slim-blue?logo=docker)
![Platform](https://img.shields.io/badge/platform-linux%2Famd64%20%7C%20linux%2Farm64-lightgrey)
![License](https://img.shields.io/github/license/matuscvengros/pirack-control)

# PiRack Control

A dashboard for a GeeekPi 6.91" 1424×280 LCD touch screen 1U rack display, built with SvelteKit. Runs on a Raspberry Pi, serves two interfaces: a touch-optimised dashboard for the LCD and a configuration page for LAN browsers.

![Dashboard](assets/dashboard.png)

Tap any panel to enter a detailed view:

![Network Detail](assets/network.png)

## Modules

| Module | Strip | Expanded |
|--------|-------|----------|
| Rack Info | Name + subtitle | — |
| Uptime | Days + HH:MM:SS | Large display |
| Network | Upload/download + sparkline | Full traffic graph |
| └ source | Internet (WAN) via a UniFi gateway, or the host NIC | — |
| Temperature | Current + 24h mini chart | 24h graph with stats |
| Cooling | ON/OFF badge | Toggle switch + relay status |

The module system is extensible — add new modules under `src/lib/modules/` without changing core code.

## Run

**Local development:**

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

**Docker (local build, default):**

```bash
docker compose up -d --build
```

**Docker (pull from GHCR):**

```bash
PIRACK_IMAGE=ghcr.io/matuscvengros/pirack-control:latest docker compose up -d --pull always
```

> On non-Pi hosts, remove the `devices` section from the compose file.

**Bare Node (no Docker):**

```bash
npm ci            # install dependencies
npm run build     # compile
npm run serve     # start detached — keeps running after you close the terminal
```

`npm run serve` runs the server in the background (logs to `server.log`); check it
with `npm run status` and stop it with `npm run stop`. Use `npm start` to run in the
foreground instead. Environment variables (e.g. `UDM_HOST`, `UDM_API_KEY`) are read
from `.env` automatically. `npm run clean` removes `build/`, `.svelte-kit/`, and
`node_modules/` for a fresh start.

> Bare Node is an alternative to Docker, not an addition — both bind the same port,
> so stop the container first (`docker compose down`) or set a different `PORT`.

## Usage

- **Dashboard:** `http://<host>:3000/dashboard`
- **Configuration:** `http://<host>:3000/config`

On the Pi, launch Chromium in kiosk mode to display the dashboard on the LCD:

```bash
chromium --kiosk --noerrdialogs --disable-infobars http://localhost:3000/dashboard
```

> The binary is `chromium` on current Raspberry Pi OS / Debian (older releases
> called it `chromium-browser`).

Chromium needs a running X session on the Pi's display. If you launch it from a
plain console or over SSH you'll get `Missing X server or $DISPLAY` — point it at
the display first:

```bash
DISPLAY=:0 chromium --kiosk --noerrdialogs --disable-infobars http://localhost:3000/dashboard
```

If the Pi has no desktop running at all, start a bare X server with just Chromium
(install once: `sudo apt install -y xserver-xorg xinit chromium`):

```bash
xinit chromium --kiosk --noerrdialogs --disable-infobars http://localhost:3000/dashboard -- :0
```

For a permanent kiosk, enable desktop autologin (`raspi-config` → *Boot / Auto
Login* → *Desktop Autologin*) and add the `chromium --kiosk …` line to your session
autostart so it launches on boot.

> Replace `localhost` with the server's address if the app runs on a different host.

App config persists in `./data/config.json` (mounted as a Docker volume).

## Network module — internet bandwidth from UniFi

The Network module integrates with the **UniFi ecosystem**. Pointed at a UniFi OS
gateway (UDM / UDR / UXG), it reports total internet (WAN) throughput in and out of
your network; without one it falls back to the host's own NIC.

**1. Create a read-only API key.** On recent UniFi versions the Integrations page
isn't shown in the menu — open it directly in a browser:

```
https://<unifi-console-address>/network/default/integrations
```

Create an API key and copy it (it is shown only once).

**2. Configure the module.** Either set environment variables — recommended, since
it keeps the key out of `config.json`:

```
UDM_HOST=<gateway-address>
UDM_API_KEY=<your-api-key>
```

…or open `http://<host>:3000/config`, expand **Network**, choose the UniFi (WAN)
source, and enter the gateway address, API key, poll interval, and units (Mbps or
MB/s).

The module polls the gateway's local API on its own timer and shows live WAN
up/download plus WAN IP, ISP, and latency. The gateway's self-signed certificate is
accepted by default. The UniFi API is rate-limited (~100 req/min), so a 1–2s
interval is comfortable.
