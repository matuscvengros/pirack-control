# PiRack Control

Dashboard application for a 1U rack-mounted 1424x280 LCD touchscreen on a Raspberry Pi 3. Displays server rack stats and controls cooling fans via GPIO relays.

## Quick Reference

```bash
npm run dev -- --host 0.0.0.0 --port 3000   # Dev server
npm run build                                 # Production build (output: build/)
npx vitest run                                # Run tests
npm run check                                 # Svelte type checking
docker compose up -d                          # Production (on Pi)
```

## Architecture

Two web interfaces from one SvelteKit app:

- **`/lcd`** — Ultra-wide strip dashboard (1424x280, dark theme, touch) shown in Chromium kiosk mode
- **`/config`** — Admin dashboard for LAN browsers, configure modules and settings
- **`/api/*`** — REST endpoints consumed by both dashboards

## Tech Stack

- **SvelteKit** with **TypeScript** and **Svelte 5 runes** (`$state`, `$derived`, `$effect`, `$props`)
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin, imported in `src/app.css`)
- **adapter-node** for server deployment (env prefix: `PIRACK_`)
- **onoff** for GPIO relay control
- **vitest** for testing

## Module System

Each module is a self-contained directory under `src/lib/modules/<name>/`:

| File | Purpose |
|------|---------|
| `meta.ts` | ID, name, icon, expandable flag, default config |
| `data.server.ts` | Server-side data provider (`getData()`, optional `onAction()`) |
| `Strip.svelte` | Compact widget for the LCD strip view |
| `Expanded.svelte` | Full-screen detail view when tapped on LCD |
| `Config.svelte` | Settings panel in the config dashboard |

**Current modules:** `rack-info`, `uptime`, `network`, `temperature`, `cooling`

**Adding a new module:** Create a directory under `src/lib/modules/` with the files above. Import and register the meta in `src/lib/modules/registry.ts`. Import the data provider in `src/routes/api/modules/[id]/data/+server.ts` (and action handler in `.../action/+server.ts` if needed). Import Strip/Expanded/Config components in the LCD page and config page.

## Key Files

- `src/lib/modules/types.ts` — `ModuleMeta`, `ModuleData`, `AppConfig` and other shared interfaces
- `src/lib/modules/registry.ts` — Module discovery, `getModule()`, `getEnabledModules()`
- `src/lib/server/config.ts` — Read/write `config.json` from `DATA_DIR`
- `src/lib/server/gpio.ts` — GPIO wrapper for PiRelay V2 (pins 19, 13, 6, 5)
- `src/routes/(lcd)/lcd/+page.svelte` — Main LCD page (strip/expanded state, API polling)
- `src/routes/(config)/config/+page.svelte` — Config page (module reorder/toggle/settings)

## Data Storage

Config and temperature history are stored as JSON files in the `data/` directory (gitignored, mounted as Docker volume):

- `data/config.json` — App configuration (rack name, module order/enabled, per-module settings)
- `data/temperature-history.json` — Rolling 24h temperature readings

If files don't exist, defaults are generated automatically.

## Hardware

- **Display:** GeeekPi 6.91" 1424x280 LCD touch (HDMI + USB touch, 5V/4W)
- **Relay Board:** SB Components PiRelay V2 (SKU06670) — 4-channel, optocoupler-isolated
  - GPIO 19 -> Relay 1, GPIO 13 -> Relay 2, GPIO 6 -> Relay 3, GPIO 5 -> Relay 4
- **Compute:** Raspberry Pi 3 running Pi OS

GPIO initialises gracefully — logs a warning if hardware is absent, reports relay states as unknown.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DATA_DIR` | `./data` | Path to config + history JSON files |

## Conventions

- Svelte 5 runes only — no `export let` or `$:` reactive declarations
- All module data providers are async and server-side only (`.server.ts`)
- LCD dashboard uses fixed 1424x280 viewport, dark theme (#07080f base), no scrolling
- Config dashboard has no auth — LAN-only access
- Cooling toggle switches all 4 relays together as one unit
- All colours follow the design spec: blue (#7dd3fc) rack name, green (#4ade80) positive, blue (#60a5fa) download, orange (#fb923c) temperature
- Commit messages use conventional commits (`feat:`, `fix:`, `chore:`)

## Design Docs

- Spec: `docs/superpowers/specs/2026-04-06-pirack-control-design.md`
- Plan: `docs/superpowers/plans/2026-04-06-pirack-control.md`
