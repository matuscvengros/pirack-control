# PiRack Control — Design Specification

## Overview

A lightweight dashboard application for a 1U rack-mounted 1424×280 LCD touchscreen, running on a Raspberry Pi 3. The app visualises server rack statistics and controls rack cooling fans via GPIO-connected relays.

Two web interfaces served from a single SvelteKit application:

1. **LCD Dashboard** (`/lcd`) — ultra-wide strip shown on the 1424×280 touch display in Chromium kiosk mode
2. **Config Dashboard** (`/config`) — standard web UI accessible from any browser on the LAN

## Hardware

### Display
- **GeeekPi 6.91" LCD** (model DP-0101)
- Resolution: 1424×280 (approximately 5:1 aspect ratio)
- Capacitive touchscreen
- HDMI input, USB touch interface
- 5V / 4W power consumption
- 10ms response time
- 1U rack-mountable (10" rack compatible)

### Relay Board
- **SB Components PiRelay V2** (SKU06670)
- 4-channel electromechanical relays
- Optocoupler-isolated
- HAT form factor, mounts directly on Raspberry Pi GPIO header
- Ratings: 250VAC/7A or 30VDC/10A per relay
- GPIO pin mapping:
  - Relay 1: GPIO 19 (Board pin 35)
  - Relay 2: GPIO 13 (Board pin 33)
  - Relay 3: GPIO 6 (Board pin 31)
  - Relay 4: GPIO 5 (Board pin 29)

### Compute
- Raspberry Pi 3 (1GB RAM, quad-core ARM Cortex-A53)
- Raspberry Pi OS
- Temperature probe(s) connected to the Pi for rack temperature monitoring

## Tech Stack

- **Framework:** SvelteKit (TypeScript)
- **Styling:** Tailwind CSS
- **Build tool:** Vite (bundled with SvelteKit)
- **Runtime:** Node.js 20
- **GPIO access:** `onoff` npm package (or equivalent Node.js GPIO library)
- **Deployment:** Docker (multi-stage build), docker-compose
- **Config storage:** JSON file on disk (mounted as Docker volume)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Raspberry Pi 3  (Docker container: Node.js + SvelteKit)        │
│                                                                 │
│  ┌──────────────┐    ┌────────────────────────────────────────┐ │
│  │  Config JSON  │◄──│  /config/*  (Config Dashboard)          │ │
│  │  (persistent) │    │  Normal browser UI for LAN access      │ │
│  └──────┬───────┘    └────────────────────────────────────────┘ │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐    ┌────────────────────────────────────────┐ │
│  │ Module Engine │───►│  /lcd/*  (LCD Dashboard)               │ │
│  │              │    │  1424×280 ultra-wide strip              │ │
│  └──────┬───────┘    └────────────────────────────────────────┘ │
│         │                                                       │
│         ▼            ┌────────────────────────────────────────┐ │
│  ┌──────────────┐    │  /api/*  (REST endpoints)               │ │
│  │  GPIO / HW   │    │  Module data, actions, config CRUD      │ │
│  │  Interface    │    └────────────────────────────────────────┘ │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
         │                              ▲
         ▼                              │
  ┌──────────────┐              ┌──────────────┐
  │  PiRelay V2  │              │  LAN Browser  │
  │  4× Relays   │              │  (config UI)  │
  └──────────────┘              └──────────────┘
                                ┌──────────────┐
                                │  LCD Screen   │
                                │  (Chromium    │
                                │   kiosk mode) │
                                └──────────────┘
```

### Route Groups

- **`/lcd`** — LCD dashboard route group. Uses a dedicated layout optimised for 1424×280. Dark theme, no scrolling, horizontal layout.
- **`/config`** — Config dashboard route group. Standard responsive layout for desktop/tablet browsers.
- **`/api`** — REST API consumed by both dashboards.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/modules` | List all modules with their enabled/order state |
| GET | `/api/modules/:id/data` | Get current data for a module |
| POST | `/api/modules/:id/action` | Execute a module action (e.g. toggle cooling) |
| GET | `/api/config` | Get full configuration |
| PUT | `/api/config` | Update configuration |

## Module System

Each module is a self-contained directory under `src/lib/modules/` with a standard contract:

```
src/lib/modules/
├── registry.ts              ← auto-discovers modules, manages config
├── types.ts                 ← shared module interface types
├── rack-info/
│   ├── meta.ts              ← id, name, icon, default config
│   ├── data.server.ts       ← data provider (server-side only)
│   ├── Strip.svelte         ← compact widget for LCD strip
│   ├── Expanded.svelte      ← full-screen detail view on LCD
│   └── Config.svelte        ← settings panel for config dashboard
├── uptime/
│   └── ...
├── network/
│   └── ...
├── temperature/
│   └── ...
└── cooling/
    └── ...
```

### Module Interface

```typescript
interface ModuleDefinition {
  id: string;                              // unique identifier, e.g. 'cooling'
  name: string;                            // display name, e.g. 'Cooling'
  icon: string;                            // emoji or icon identifier
  defaultConfig: Record<string, unknown>;  // module-specific default settings

  getData(config: ModuleConfig): Promise<ModuleData>;
  onAction?(action: string, payload: unknown, config: ModuleConfig): Promise<ActionResult>;
}

interface ModuleData {
  [key: string]: unknown;  // module-specific data shape
}

interface ActionResult {
  success: boolean;
  data?: unknown;
}
```

### Adding a New Module

To add a module, create a new directory under `src/lib/modules/` following the contract above. The registry auto-discovers it. No changes to core application code are needed.

## LCD Dashboard

### Home Strip View

Full-height horizontal panels displayed left to right. Each panel is tappable and expands to a full-screen detail view.

**Panel order (default, configurable):**

| # | Module | Strip Content |
|---|--------|--------------|
| 1 | Rack Info | Rack name (large, bold), subtitle IP address. Always visible, non-expandable. |
| 2 | Uptime | Large numerals: days, hours, minutes. |
| 3 | Network | Upload/download rates with mini sparkline graph. |
| 4 | Temperature | Current reading (large), 24h mini chart, peak indicator. |
| 5 | Cooling | Snowflake icon, ON/OFF badge. |

**Visual design:**
- Dark theme (background ~#07080f)
- Full-height panels with subtle gradient backgrounds
- Panels separated by 1px vertical dividers (#1a2040)
- Large, high-contrast text readable from several metres away
- Subtle bottom accent line spanning full width
- Colour coding: blue (#7dd3fc) for rack name, green (#4ade80) for upload/positive, blue (#60a5fa) for download, orange (#fb923c) for temperature, green for cooling ON, red for cooling OFF

### Expanded Views

When a panel is tapped, it transitions (CSS fade/slide) to fill the entire 1424×280 display.

**Common elements:**
- Home button (🏠) on the far left — tapping returns to strip
- Auto-return timer displayed in top-right corner (default 60 seconds)
- After timeout, automatically transitions back to home strip

**Network expanded:** Full-width traffic graph (upload + download lines), peak stats, total daily transfer.

**Temperature expanded:** Full 24h sliding window graph with current/high/low/average stats. Danger threshold line (configurable). Y-axis temperature labels, X-axis time labels.

**Cooling expanded:** Large single toggle switch for all 4 relays (on/off together). Relay status indicators (R1-R4) showing individual states. Current rack temperature displayed for context.

**Uptime expanded:** Extended uptime information (could show restart history or system info in future).

## Config Dashboard

Standard responsive web UI, no authentication (LAN-only access).

### Pages

**Module Management (main page):**
- List of all available modules
- Drag to reorder their position on the LCD strip
- Toggle to enable/disable each module on the LCD

**General Settings:**
- Rack name
- Rack subtitle (e.g. IP address)
- LCD auto-return timeout (default: 60 seconds)

**Per-Module Settings** (click a module to configure):
- **Rack Info:** name, subtitle
- **Uptime:** no configuration needed
- **Network:** data refresh interval, data source notes (for future UDM Pro integration)
- **Temperature:** probe configuration, danger threshold temperature, data refresh interval, history retention period
- **Cooling:** relay labels (R1-R4), all-at-once toggle behaviour

## Data Storage

### Configuration (`config.json`)

```json
{
  "general": {
    "rackName": "HOME-LAB",
    "rackSubtitle": "192.168.1.50",
    "lcdAutoReturnSeconds": 60
  },
  "modules": {
    "order": ["rack-info", "uptime", "network", "temperature", "cooling"],
    "enabled": ["rack-info", "uptime", "network", "temperature", "cooling"],
    "settings": {
      "network": { "refreshInterval": 5000 },
      "temperature": {
        "refreshInterval": 10000,
        "dangerThreshold": 45,
        "probes": []
      },
      "cooling": {
        "relayLabels": ["R1", "R2", "R3", "R4"]
      }
    }
  }
}
```

### Temperature History (`temperature-history.json`)

Rolling 24-hour window of temperature readings at 1-minute intervals (~1440 data points). Older entries are pruned automatically.

```json
{
  "readings": [
    { "timestamp": 1712400000, "value": 38.2 },
    { "timestamp": 1712400060, "value": 38.1 }
  ]
}
```

## GPIO Access

GPIO is accessed directly via the `onoff` library (or equivalent). The cooling module should catch GPIO initialisation errors gracefully — if hardware is absent, the module logs a warning and reports relay states as unknown. No mock mode or simulated states; it simply won't control hardware that isn't there.

**Pin mapping (BCM numbering):**
- GPIO 19 → Relay 1
- GPIO 13 → Relay 2
- GPIO 6 → Relay 3
- GPIO 5 → Relay 4

**Cooling toggle behaviour:** All 4 relays switch together as a single unit. The UI presents one ON/OFF toggle; the backend sets all 4 GPIO pins to the same state.

## Deployment

### Dockerfile

Multi-stage build:
1. **Build stage:** `node:20-slim` — install dependencies, build SvelteKit app
2. **Runtime stage:** `node:20-slim` — copy built output, run with `node build`

### docker-compose.yml

```yaml
services:
  pirack-control:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data          # config.json + temperature history
    devices:
      - /dev/gpiomem:/dev/gpiomem # GPIO access (Pi only)
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

- Port 3000 mapped to host
- `./data/` volume persists configuration and temperature history across container rebuilds
- `/dev/gpiomem` passed through for relay control (omit on non-Pi hosts)
- `restart: unless-stopped` for reliability

### LCD Kiosk Setup (outside container)

Chromium launched in kiosk mode on the Pi's desktop, pointing at `http://localhost:3000/lcd`. This is configured outside the Docker container on the Pi OS desktop environment.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DATA_DIR` | Path to data directory (config + history) | `/app/data` |

## Security

- No authentication — application is behind a secure internal LAN
- `.env` files must be in `.gitignore` (public repository)
- No secrets stored in code or config
- GPIO access requires appropriate Linux permissions (handled by Docker device passthrough)

## Initial Modules (v1)

| Module | Strip | Expanded | Actions |
|--------|-------|----------|---------|
| rack-info | Rack name + subtitle | — (not expandable) | None |
| uptime | Days/hours/minutes | Extended info | None |
| network | Upload/download rates + sparkline | Full traffic graph, peaks, daily total | None |
| temperature | Current temp + 24h mini chart | Full 24h graph, high/low/avg stats | None |
| cooling | ON/OFF badge | Toggle switch, relay indicators, current temp | Toggle on/off |

## Future Extensibility

The module system is designed so that new modules can be added without modifying core code. Potential future modules:
- NAS storage/CPU monitoring (via SSH or API)
- UDM Pro network stats integration
- Docker container status
- DNS/Pi-hole statistics
- Custom alert thresholds with visual indicators
