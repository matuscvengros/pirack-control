[![Build](https://github.com/matuscvengros/pirack-control/actions/workflows/build.yml/badge.svg)](https://github.com/matuscvengros/pirack-control/actions/workflows/build.yml)
[![Release](https://github.com/matuscvengros/pirack-control/actions/workflows/release.yml/badge.svg)](https://github.com/matuscvengros/pirack-control/actions/workflows/release.yml)
![Docker](https://img.shields.io/badge/docker-node%3A24--slim-blue?logo=docker)
![Platform](https://img.shields.io/badge/platform-linux%2Famd64%20%7C%20linux%2Farm64-lightgrey)
![License](https://img.shields.io/github/license/matuscvengros/pirack-control)

# PiRack Control

A dashboard for the [GeeekPi 6.91" 1424×280 LCD Touch Screen](https://www.amazon.com.au/dp/B0G337KQS6) 1U rack display, built with SvelteKit. Runs on a Raspberry Pi, serves two interfaces: a touch-optimised dashboard for the LCD and a configuration page for LAN browsers.

![Dashboard](assets/dashboard.png)

Tap any panel to enter a detailed view:

![Network Detail](assets/network.png)

## Modules

| Module | Strip | Expanded |
|--------|-------|----------|
| Rack Info | Name + subtitle | — |
| Uptime | Days + HH:MM:SS | Large display |
| Network | Upload/download + sparkline | Full traffic graph |
| └ source | Whole-house internet (UDM Pro WAN) or this Pi's NIC | — |
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

## Usage

- **Dashboard:** `http://<host>:3000/dashboard`
- **Configuration:** `http://<host>:3000/config`

On the Pi, launch Chromium in kiosk mode to display the dashboard on the LCD:

```bash
chromium-browser --kiosk --noerrdialogs --disable-infobars http://localhost:3000/dashboard
```

App config persists in `./data/config.json` (mounted as a Docker volume).

## Network (WAN) module — whole-house internet bandwidth

The Network module can show total internet throughput in/out of the house, read
from a UniFi OS console (UDM Pro / UDR / UXG) instead of the Pi's own NIC.

1. In the UniFi console, create a read-only **local API key**:
   Settings → Control Plane → Integrations → API Keys.
2. Open `http://<host>:3000/config`, expand the **Network** module settings, and set:
   - **Source:** *UDM Pro — whole-house internet (WAN)*
   - **UDM Pro host / IP:** e.g. `192.168.1.1`
   - **API key:** paste the key (or leave blank and set the `UDM_API_KEY` env var
     to keep the secret out of `config.json`)
   - **Poll interval:** `2000` ms (1–2s gives a near-real-time graph)
   - **Units:** Mbps or MB/s
3. Save. The panel polls the console's local Network API
   (`/proxy/network/api/s/<site>/stat/health`) on its own timer and shows live
   WAN up/download, the WAN IP, and latency.

The console's self-signed certificate is accepted by default (toggle off if you've
installed a trusted cert). The official UniFi API is rate-limited to ~100 req/min,
so a 1–2s interval stays well within budget.
