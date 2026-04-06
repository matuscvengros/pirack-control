# PiRack Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modular SvelteKit dashboard for a 1424×280 LCD touchscreen that displays server rack stats and controls cooling fans via GPIO relays.

**Architecture:** Single SvelteKit app with two route groups (`/lcd` for the ultra-wide display, `/config` for LAN admin). Modules are self-contained directories under `src/lib/modules/` with strip, expanded, and config Svelte components plus a server-side data provider. A JSON file on disk stores configuration and temperature history.

**Tech Stack:** SvelteKit (TypeScript), Svelte 5 (runes), Tailwind CSS v4, adapter-node, onoff (GPIO), Docker

---

## File Structure

```
pirack-control/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── .env.example
├── .gitignore
├── data/                              # Docker volume mount (gitignored)
│   ├── config.json
│   └── temperature-history.json
├── src/
│   ├── app.html                       # Shell HTML template
│   ├── app.css                        # Tailwind directives + LCD base styles
│   ├── lib/
│   │   ├── server/
│   │   │   ├── config.ts              # Read/write config.json
│   │   │   └── gpio.ts                # GPIO wrapper for relay control
│   │   ├── modules/
│   │   │   ├── types.ts               # Module interface definitions
│   │   │   ├── registry.ts            # Module discovery + registration
│   │   │   ├── rack-info/
│   │   │   │   ├── meta.ts
│   │   │   │   ├── data.server.ts
│   │   │   │   ├── Strip.svelte
│   │   │   │   └── Config.svelte
│   │   │   ├── uptime/
│   │   │   │   ├── meta.ts
│   │   │   │   ├── data.server.ts
│   │   │   │   ├── Strip.svelte
│   │   │   │   ├── Expanded.svelte
│   │   │   │   └── Config.svelte
│   │   │   ├── network/
│   │   │   │   ├── meta.ts
│   │   │   │   ├── data.server.ts
│   │   │   │   ├── Strip.svelte
│   │   │   │   ├── Expanded.svelte
│   │   │   │   └── Config.svelte
│   │   │   ├── temperature/
│   │   │   │   ├── meta.ts
│   │   │   │   ├── data.server.ts
│   │   │   │   ├── Strip.svelte
│   │   │   │   ├── Expanded.svelte
│   │   │   │   └── Config.svelte
│   │   │   └── cooling/
│   │   │       ├── meta.ts
│   │   │       ├── data.server.ts
│   │   │       ├── Strip.svelte
│   │   │       ├── Expanded.svelte
│   │   │       └── Config.svelte
│   │   └── components/
│   │       ├── lcd/
│   │       │   ├── StripPanel.svelte  # Wrapper for each strip panel
│   │       │   ├── HomeButton.svelte  # Home button for expanded views
│   │       │   └── AutoReturn.svelte  # Auto-return timer component
│   │       └── config/
│   │           └── ModuleCard.svelte  # Module card for config dashboard
│   ├── routes/
│   │   ├── +layout.svelte            # Root layout (minimal)
│   │   ├── +page.svelte              # Root redirect to /lcd
│   │   ├── (lcd)/
│   │   │   ├── +layout.svelte        # LCD layout (1424×280, dark, no scroll)
│   │   │   └── lcd/
│   │   │       ├── +page.svelte      # LCD home strip
│   │   │       └── +page.server.ts   # Load enabled modules + data
│   │   ├── (config)/
│   │   │   ├── +layout.svelte        # Config layout (standard responsive)
│   │   │   └── config/
│   │   │       ├── +page.svelte      # Config main page
│   │   │       └── +page.server.ts   # Load config + modules
│   │   └── api/
│   │       ├── modules/
│   │       │   ├── +server.ts         # GET /api/modules
│   │       │   └── [id]/
│   │       │       ├── data/
│   │       │       │   └── +server.ts # GET /api/modules/:id/data
│   │       │       └── action/
│   │       │           └── +server.ts # POST /api/modules/:id/action
│   │       └── config/
│   │           └── +server.ts         # GET/PUT /api/config
│   └── hooks.server.ts               # Optional: logging, error handling
└── tests/
    ├── unit/
    │   ├── config.test.ts
    │   ├── registry.test.ts
    │   └── modules/
    │       ├── rack-info.test.ts
    │       ├── uptime.test.ts
    │       ├── network.test.ts
    │       ├── temperature.test.ts
    │       └── cooling.test.ts
    └── integration/
        └── api.test.ts
```

---

### Task 1: Scaffold SvelteKit Project

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `src/app.html`, `src/app.css`, `.env.example`, `.gitignore`

- [ ] **Step 1: Create the SvelteKit project**

Run:
```bash
cd /home/claude/pirack-control
npm create svelte@latest . -- --template skeleton --types typescript
```

Select: Skeleton project, TypeScript, no additional options.

If the interactive prompt blocks, use:
```bash
npx sv create . --template minimal --types ts --no-add-ons
```

- [ ] **Step 2: Install core dependencies**

Run:
```bash
npm install
npm install -D @sveltejs/adapter-node tailwindcss @tailwindcss/vite
npm install onoff
```

- [ ] **Step 3: Configure adapter-node in svelte.config.js**

Replace `svelte.config.js` contents with:

```js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			out: 'build',
			precompress: false,
			envPrefix: 'PIRACK_'
		})
	}
};

export default config;
```

- [ ] **Step 4: Configure Tailwind in vite.config.ts**

Replace `vite.config.ts` contents with:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()]
});
```

- [ ] **Step 5: Set up Tailwind CSS in src/app.css**

Replace `src/app.css` contents with:

```css
@import 'tailwindcss';
```

- [ ] **Step 6: Create src/app.html shell**

Replace `src/app.html` contents with:

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=1424" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		%sveltekit.head%
	</head>
	<body>
		<div>%sveltekit.body%</div>
	</body>
</html>
```

- [ ] **Step 7: Create .env.example and update .gitignore**

Create `.env.example`:
```
PORT=3000
DATA_DIR=./data
```

Append to `.gitignore`:
```
node_modules/
build/
.svelte-kit/
data/
.env
.firecrawl/
.superpowers/
```

- [ ] **Step 8: Create data directory with default config**

```bash
mkdir -p data
```

Create `data/config.json`:
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

Create `data/temperature-history.json`:
```json
{
  "readings": []
}
```

- [ ] **Step 9: Verify dev server starts**

Run: `npm run dev -- --host 0.0.0.0 --port 3000`

Expected: Server starts on http://localhost:3000 with the default SvelteKit welcome page.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold SvelteKit project with adapter-node and Tailwind"
```

---

### Task 2: Module Type System and Config Server

**Files:**
- Create: `src/lib/modules/types.ts`, `src/lib/server/config.ts`
- Test: `tests/unit/config.test.ts`

- [ ] **Step 1: Install test dependencies**

Run:
```bash
npm install -D vitest @testing-library/svelte jsdom
```

Add to `vite.config.ts` (add the test block inside defineConfig):

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		include: ['tests/**/*.test.ts'],
		environment: 'node'
	}
});
```

- [ ] **Step 2: Create the module type definitions**

Create `src/lib/modules/types.ts`:

```ts
export interface ModuleConfig {
	[key: string]: unknown;
}

export interface ModuleData {
	[key: string]: unknown;
}

export interface ActionResult {
	success: boolean;
	data?: unknown;
	error?: string;
}

export interface ModuleMeta {
	id: string;
	name: string;
	icon: string;
	expandable: boolean;
	defaultConfig: ModuleConfig;
}

export interface ModuleDefinition extends ModuleMeta {
	getData(config: ModuleConfig): Promise<ModuleData>;
	onAction?(action: string, payload: unknown, config: ModuleConfig): Promise<ActionResult>;
}

export interface AppConfig {
	general: {
		rackName: string;
		rackSubtitle: string;
		lcdAutoReturnSeconds: number;
	};
	modules: {
		order: string[];
		enabled: string[];
		settings: Record<string, ModuleConfig>;
	};
}
```

- [ ] **Step 3: Write failing tests for config server**

Create `tests/unit/config.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { loadConfig, saveConfig, getDefaultConfig } from '$lib/server/config';

const TEST_DATA_DIR = path.join(process.cwd(), 'tests', '.test-data');
const TEST_CONFIG_PATH = path.join(TEST_DATA_DIR, 'config.json');

describe('config', () => {
	beforeEach(() => {
		fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
		process.env.DATA_DIR = TEST_DATA_DIR;
	});

	afterEach(() => {
		fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
		delete process.env.DATA_DIR;
	});

	it('returns default config when no file exists', () => {
		const config = loadConfig();
		expect(config.general.rackName).toBe('HOME-LAB');
		expect(config.modules.order).toContain('rack-info');
	});

	it('loads config from file', () => {
		const custom = getDefaultConfig();
		custom.general.rackName = 'MY-RACK';
		fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(custom));

		const config = loadConfig();
		expect(config.general.rackName).toBe('MY-RACK');
	});

	it('saves config to file', () => {
		const config = getDefaultConfig();
		config.general.rackName = 'SAVED-RACK';
		saveConfig(config);

		const raw = JSON.parse(fs.readFileSync(TEST_CONFIG_PATH, 'utf-8'));
		expect(raw.general.rackName).toBe('SAVED-RACK');
	});
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx vitest run tests/unit/config.test.ts`

Expected: FAIL — cannot resolve `$lib/server/config`

- [ ] **Step 5: Implement the config server**

Create `src/lib/server/config.ts`:

```ts
import fs from 'fs';
import path from 'path';
import type { AppConfig } from '$lib/modules/types';

function getDataDir(): string {
	return process.env.DATA_DIR || path.join(process.cwd(), 'data');
}

function getConfigPath(): string {
	return path.join(getDataDir(), 'config.json');
}

export function getDefaultConfig(): AppConfig {
	return {
		general: {
			rackName: 'HOME-LAB',
			rackSubtitle: '192.168.1.50',
			lcdAutoReturnSeconds: 60
		},
		modules: {
			order: ['rack-info', 'uptime', 'network', 'temperature', 'cooling'],
			enabled: ['rack-info', 'uptime', 'network', 'temperature', 'cooling'],
			settings: {
				network: { refreshInterval: 5000 },
				temperature: {
					refreshInterval: 10000,
					dangerThreshold: 45,
					probes: []
				},
				cooling: {
					relayLabels: ['R1', 'R2', 'R3', 'R4']
				}
			}
		}
	};
}

export function loadConfig(): AppConfig {
	const configPath = getConfigPath();
	try {
		const raw = fs.readFileSync(configPath, 'utf-8');
		return JSON.parse(raw) as AppConfig;
	} catch {
		return getDefaultConfig();
	}
}

export function saveConfig(config: AppConfig): void {
	const configPath = getConfigPath();
	const dir = path.dirname(configPath);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/unit/config.test.ts`

Expected: 3 tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/modules/types.ts src/lib/server/config.ts tests/unit/config.test.ts
git commit -m "feat: add module type system and config read/write"
```

---

### Task 3: GPIO Wrapper

**Files:**
- Create: `src/lib/server/gpio.ts`

- [ ] **Step 1: Create the GPIO wrapper**

Create `src/lib/server/gpio.ts`:

```ts
import type { Gpio as GpioType } from 'onoff';

const RELAY_PINS = [19, 13, 6, 5] as const;

let gpioAvailable = false;
let gpios: GpioType[] = [];

try {
	const { Gpio } = await import('onoff');
	if (Gpio.accessible) {
		gpios = RELAY_PINS.map((pin) => new Gpio(pin, 'out'));
		gpioAvailable = true;
		console.log('[GPIO] Initialised relay pins:', RELAY_PINS.join(', '));
	} else {
		console.warn('[GPIO] GPIO not accessible on this platform');
	}
} catch (e) {
	console.warn('[GPIO] onoff not available:', (e as Error).message);
}

export function isGpioAvailable(): boolean {
	return gpioAvailable;
}

export function getRelayStates(): boolean[] {
	if (!gpioAvailable) {
		return RELAY_PINS.map(() => false);
	}
	return gpios.map((gpio) => gpio.readSync() === 1);
}

export function setAllRelays(on: boolean): boolean[] {
	if (!gpioAvailable) {
		return RELAY_PINS.map(() => false);
	}
	const value = on ? 1 : 0;
	gpios.forEach((gpio) => gpio.writeSync(value));
	return getRelayStates();
}

export function cleanup(): void {
	if (gpioAvailable) {
		gpios.forEach((gpio) => gpio.unexport());
		console.log('[GPIO] Cleaned up relay pins');
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/server/gpio.ts
git commit -m "feat: add GPIO wrapper for relay control"
```

---

### Task 4: Module Registry

**Files:**
- Create: `src/lib/modules/registry.ts`
- Test: `tests/unit/registry.test.ts`

- [ ] **Step 1: Write failing test for registry**

Create `tests/unit/registry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { registry, getModule, getEnabledModules } from '$lib/modules/registry';

describe('registry', () => {
	it('contains all five modules', () => {
		const ids = registry.map((m) => m.id);
		expect(ids).toContain('rack-info');
		expect(ids).toContain('uptime');
		expect(ids).toContain('network');
		expect(ids).toContain('temperature');
		expect(ids).toContain('cooling');
	});

	it('getModule returns a module by id', () => {
		const mod = getModule('rack-info');
		expect(mod).toBeDefined();
		expect(mod!.name).toBe('Rack Info');
	});

	it('getModule returns undefined for unknown id', () => {
		expect(getModule('nonexistent')).toBeUndefined();
	});

	it('getEnabledModules respects order and enabled list', () => {
		const modules = getEnabledModules(
			['network', 'rack-info'],
			['rack-info', 'network', 'uptime']
		);
		expect(modules.map((m) => m.id)).toEqual(['network', 'rack-info']);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/registry.test.ts`

Expected: FAIL — cannot resolve `$lib/modules/registry`

- [ ] **Step 3: Create module meta files (all five)**

Create `src/lib/modules/rack-info/meta.ts`:

```ts
import type { ModuleMeta } from '$lib/modules/types';

const meta: ModuleMeta = {
	id: 'rack-info',
	name: 'Rack Info',
	icon: '🖥️',
	expandable: false,
	defaultConfig: {}
};

export default meta;
```

Create `src/lib/modules/uptime/meta.ts`:

```ts
import type { ModuleMeta } from '$lib/modules/types';

const meta: ModuleMeta = {
	id: 'uptime',
	name: 'Uptime',
	icon: '⏱️',
	expandable: true,
	defaultConfig: {}
};

export default meta;
```

Create `src/lib/modules/network/meta.ts`:

```ts
import type { ModuleMeta } from '$lib/modules/types';

const meta: ModuleMeta = {
	id: 'network',
	name: 'Network',
	icon: '📡',
	expandable: true,
	defaultConfig: {
		refreshInterval: 5000
	}
};

export default meta;
```

Create `src/lib/modules/temperature/meta.ts`:

```ts
import type { ModuleMeta } from '$lib/modules/types';

const meta: ModuleMeta = {
	id: 'temperature',
	name: 'Temperature',
	icon: '🌡️',
	expandable: true,
	defaultConfig: {
		refreshInterval: 10000,
		dangerThreshold: 45,
		probes: []
	}
};

export default meta;
```

Create `src/lib/modules/cooling/meta.ts`:

```ts
import type { ModuleMeta } from '$lib/modules/types';

const meta: ModuleMeta = {
	id: 'cooling',
	name: 'Cooling',
	icon: '❄️',
	expandable: true,
	defaultConfig: {
		relayLabels: ['R1', 'R2', 'R3', 'R4']
	}
};

export default meta;
```

- [ ] **Step 4: Implement the registry**

Create `src/lib/modules/registry.ts`:

```ts
import type { ModuleMeta } from '$lib/modules/types';
import rackInfoMeta from './rack-info/meta';
import uptimeMeta from './uptime/meta';
import networkMeta from './network/meta';
import temperatureMeta from './temperature/meta';
import coolingMeta from './cooling/meta';

export const registry: ModuleMeta[] = [
	rackInfoMeta,
	uptimeMeta,
	networkMeta,
	temperatureMeta,
	coolingMeta
];

export function getModule(id: string): ModuleMeta | undefined {
	return registry.find((m) => m.id === id);
}

export function getEnabledModules(order: string[], enabled: string[]): ModuleMeta[] {
	return order
		.filter((id) => enabled.includes(id))
		.map((id) => getModule(id))
		.filter((m): m is ModuleMeta => m !== undefined);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/unit/registry.test.ts`

Expected: 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/modules/
git commit -m "feat: add module meta definitions and registry"
```

---

### Task 5: Module Data Providers (Server-Side)

**Files:**
- Create: `src/lib/modules/rack-info/data.server.ts`, `src/lib/modules/uptime/data.server.ts`, `src/lib/modules/network/data.server.ts`, `src/lib/modules/temperature/data.server.ts`, `src/lib/modules/cooling/data.server.ts`

- [ ] **Step 1: Create rack-info data provider**

Create `src/lib/modules/rack-info/data.server.ts`:

```ts
import type { ModuleConfig, ModuleData } from '$lib/modules/types';
import { loadConfig } from '$lib/server/config';

export async function getData(_config: ModuleConfig): Promise<ModuleData> {
	const appConfig = loadConfig();
	return {
		rackName: appConfig.general.rackName,
		rackSubtitle: appConfig.general.rackSubtitle
	};
}
```

- [ ] **Step 2: Create uptime data provider**

Create `src/lib/modules/uptime/data.server.ts`:

```ts
import os from 'os';
import type { ModuleConfig, ModuleData } from '$lib/modules/types';

export async function getData(_config: ModuleConfig): Promise<ModuleData> {
	const uptimeSeconds = os.uptime();
	const days = Math.floor(uptimeSeconds / 86400);
	const hours = Math.floor((uptimeSeconds % 86400) / 3600);
	const minutes = Math.floor((uptimeSeconds % 3600) / 60);

	return {
		totalSeconds: uptimeSeconds,
		days,
		hours,
		minutes
	};
}
```

- [ ] **Step 3: Create network data provider**

Create `src/lib/modules/network/data.server.ts`:

```ts
import os from 'os';
import fs from 'fs';
import type { ModuleConfig, ModuleData } from '$lib/modules/types';

interface NetSample {
	timestamp: number;
	rxBytes: number;
	txBytes: number;
}

let lastSample: NetSample | null = null;
const history: { timestamp: number; rxRate: number; txRate: number }[] = [];
const MAX_HISTORY = 60; // 5 minutes at 5s intervals

function getNetworkBytes(): { rxBytes: number; txBytes: number } {
	// Try reading from /proc/net/dev (Linux)
	try {
		const raw = fs.readFileSync('/proc/net/dev', 'utf-8');
		const lines = raw.split('\n').slice(2); // skip headers
		let rxTotal = 0;
		let txTotal = 0;
		for (const line of lines) {
			const parts = line.trim().split(/\s+/);
			if (parts.length < 10) continue;
			const iface = parts[0].replace(':', '');
			if (iface === 'lo') continue; // skip loopback
			rxTotal += parseInt(parts[1], 10);
			txTotal += parseInt(parts[9], 10);
		}
		return { rxBytes: rxTotal, txBytes: txTotal };
	} catch {
		// Fallback: use os.networkInterfaces for basic info
		return { rxBytes: 0, txBytes: 0 };
	}
}

export async function getData(_config: ModuleConfig): Promise<ModuleData> {
	const now = Date.now();
	const current = getNetworkBytes();

	let rxRate = 0;
	let txRate = 0;

	if (lastSample) {
		const elapsed = (now - lastSample.timestamp) / 1000;
		if (elapsed > 0) {
			rxRate = (current.rxBytes - lastSample.rxBytes) / elapsed;
			txRate = (current.txBytes - lastSample.txBytes) / elapsed;
		}
	}

	lastSample = { timestamp: now, ...current };

	// Store history point
	history.push({ timestamp: now, rxRate, txRate });
	if (history.length > MAX_HISTORY) {
		history.shift();
	}

	// Get primary IP
	const interfaces = os.networkInterfaces();
	let primaryIp = '0.0.0.0';
	for (const [name, addrs] of Object.entries(interfaces)) {
		if (name === 'lo') continue;
		const ipv4 = addrs?.find((a) => a.family === 'IPv4' && !a.internal);
		if (ipv4) {
			primaryIp = ipv4.address;
			break;
		}
	}

	return {
		rxRate: Math.round(rxRate),
		txRate: Math.round(txRate),
		primaryIp,
		history: history.map((h) => ({
			timestamp: h.timestamp,
			rxRate: Math.round(h.rxRate),
			txRate: Math.round(h.txRate)
		}))
	};
}
```

- [ ] **Step 4: Create temperature data provider**

Create `src/lib/modules/temperature/data.server.ts`:

```ts
import fs from 'fs';
import path from 'path';
import type { ModuleConfig, ModuleData, ActionResult } from '$lib/modules/types';

interface TemperatureReading {
	timestamp: number;
	value: number;
}

interface TemperatureHistory {
	readings: TemperatureReading[];
}

function getDataDir(): string {
	return process.env.DATA_DIR || path.join(process.cwd(), 'data');
}

function getHistoryPath(): string {
	return path.join(getDataDir(), 'temperature-history.json');
}

function loadHistory(): TemperatureHistory {
	try {
		const raw = fs.readFileSync(getHistoryPath(), 'utf-8');
		return JSON.parse(raw);
	} catch {
		return { readings: [] };
	}
}

function saveHistory(history: TemperatureHistory): void {
	const dir = path.dirname(getHistoryPath());
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(getHistoryPath(), JSON.stringify(history));
}

function readSystemTemp(): number | null {
	// Try reading Raspberry Pi thermal zone
	try {
		const raw = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf-8');
		return parseInt(raw.trim(), 10) / 1000;
	} catch {
		return null;
	}
}

function pruneOldReadings(readings: TemperatureReading[]): TemperatureReading[] {
	const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
	return readings.filter((r) => r.timestamp > cutoff);
}

export async function getData(config: ModuleConfig): Promise<ModuleData> {
	const currentTemp = readSystemTemp();
	const history = loadHistory();

	// Record new reading if we have a temperature
	if (currentTemp !== null) {
		const lastReading = history.readings[history.readings.length - 1];
		const now = Date.now();
		// Only record if at least 60 seconds since last reading
		if (!lastReading || now - lastReading.timestamp >= 60000) {
			history.readings.push({ timestamp: now, value: currentTemp });
			history.readings = pruneOldReadings(history.readings);
			saveHistory(history);
		}
	}

	const readings = pruneOldReadings(history.readings);
	const values = readings.map((r) => r.value);
	const high = values.length > 0 ? Math.max(...values) : null;
	const low = values.length > 0 ? Math.min(...values) : null;
	const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;

	return {
		current: currentTemp,
		high: high !== null ? Math.round(high * 10) / 10 : null,
		low: low !== null ? Math.round(low * 10) / 10 : null,
		avg: avg !== null ? Math.round(avg * 10) / 10 : null,
		dangerThreshold: (config.dangerThreshold as number) ?? 45,
		history: readings.map((r) => ({
			timestamp: r.timestamp,
			value: Math.round(r.value * 10) / 10
		}))
	};
}
```

- [ ] **Step 5: Create cooling data provider**

Create `src/lib/modules/cooling/data.server.ts`:

```ts
import type { ModuleConfig, ModuleData, ActionResult } from '$lib/modules/types';
import { getRelayStates, setAllRelays, isGpioAvailable } from '$lib/server/gpio';

export async function getData(_config: ModuleConfig): Promise<ModuleData> {
	const relayStates = getRelayStates();
	const anyOn = relayStates.some((s) => s);

	return {
		on: anyOn,
		relays: relayStates,
		gpioAvailable: isGpioAvailable()
	};
}

export async function onAction(
	action: string,
	_payload: unknown,
	_config: ModuleConfig
): Promise<ActionResult> {
	if (action === 'toggle') {
		const currentStates = getRelayStates();
		const anyOn = currentStates.some((s) => s);
		const newStates = setAllRelays(!anyOn);
		return {
			success: true,
			data: { on: !anyOn, relays: newStates }
		};
	}
	return { success: false, error: `Unknown action: ${action}` };
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/modules/*/data.server.ts
git commit -m "feat: add server-side data providers for all modules"
```

---

### Task 6: API Endpoints

**Files:**
- Create: `src/routes/api/modules/+server.ts`, `src/routes/api/modules/[id]/data/+server.ts`, `src/routes/api/modules/[id]/action/+server.ts`, `src/routes/api/config/+server.ts`

- [ ] **Step 1: Create GET /api/modules endpoint**

Create `src/routes/api/modules/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadConfig } from '$lib/server/config';
import { registry } from '$lib/modules/registry';

export const GET: RequestHandler = async () => {
	const config = loadConfig();
	const modules = registry.map((m) => ({
		id: m.id,
		name: m.name,
		icon: m.icon,
		expandable: m.expandable,
		enabled: config.modules.enabled.includes(m.id),
		order: config.modules.order.indexOf(m.id)
	}));

	modules.sort((a, b) => a.order - b.order);
	return json(modules);
};
```

- [ ] **Step 2: Create GET /api/modules/:id/data endpoint**

Create `src/routes/api/modules/[id]/data/+server.ts`:

```ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadConfig } from '$lib/server/config';
import { getModule } from '$lib/modules/registry';

// Import data providers
import { getData as getRackInfoData } from '$lib/modules/rack-info/data.server';
import { getData as getUptimeData } from '$lib/modules/uptime/data.server';
import { getData as getNetworkData } from '$lib/modules/network/data.server';
import { getData as getTemperatureData } from '$lib/modules/temperature/data.server';
import { getData as getCoolingData } from '$lib/modules/cooling/data.server';

const dataProviders: Record<string, (config: Record<string, unknown>) => Promise<Record<string, unknown>>> = {
	'rack-info': getRackInfoData,
	'uptime': getUptimeData,
	'network': getNetworkData,
	'temperature': getTemperatureData,
	'cooling': getCoolingData
};

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	const meta = getModule(id);

	if (!meta) {
		error(404, `Module "${id}" not found`);
	}

	const provider = dataProviders[id];
	if (!provider) {
		error(404, `No data provider for module "${id}"`);
	}

	const config = loadConfig();
	const moduleConfig = config.modules.settings[id] ?? meta.defaultConfig;
	const data = await provider(moduleConfig);

	return json(data);
};
```

- [ ] **Step 3: Create POST /api/modules/:id/action endpoint**

Create `src/routes/api/modules/[id]/action/+server.ts`:

```ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadConfig } from '$lib/server/config';
import { getModule } from '$lib/modules/registry';
import { onAction as coolingAction } from '$lib/modules/cooling/data.server';

const actionHandlers: Record<
	string,
	(action: string, payload: unknown, config: Record<string, unknown>) => Promise<{ success: boolean; data?: unknown; error?: string }>
> = {
	cooling: coolingAction
};

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = params;
	const meta = getModule(id);

	if (!meta) {
		error(404, `Module "${id}" not found`);
	}

	const handler = actionHandlers[id];
	if (!handler) {
		error(400, `Module "${id}" does not support actions`);
	}

	const body = await request.json();
	const { action, payload } = body as { action: string; payload?: unknown };

	if (!action) {
		error(400, 'Missing "action" field');
	}

	const config = loadConfig();
	const moduleConfig = config.modules.settings[id] ?? meta.defaultConfig;
	const result = await handler(action, payload, moduleConfig);

	return json(result);
};
```

- [ ] **Step 4: Create GET/PUT /api/config endpoint**

Create `src/routes/api/config/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadConfig, saveConfig } from '$lib/server/config';
import type { AppConfig } from '$lib/modules/types';

export const GET: RequestHandler = async () => {
	const config = loadConfig();
	return json(config);
};

export const PUT: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as AppConfig;
	saveConfig(body);
	return json({ success: true });
};
```

- [ ] **Step 5: Verify the dev server starts and endpoints respond**

Run: `npm run dev -- --host 0.0.0.0 --port 3000`

Then in another terminal:
```bash
curl http://localhost:3000/api/modules
curl http://localhost:3000/api/modules/uptime/data
curl http://localhost:3000/api/config
```

Expected: JSON responses with module list, uptime data, and config.

- [ ] **Step 6: Commit**

```bash
git add src/routes/api/
git commit -m "feat: add REST API endpoints for modules and config"
```

---

### Task 7: LCD Layout and Root Route

**Files:**
- Create: `src/routes/+layout.svelte`, `src/routes/+page.svelte`, `src/routes/(lcd)/+layout.svelte`, `src/routes/(lcd)/lcd/+page.server.ts`, `src/routes/(lcd)/lcd/+page.svelte`

- [ ] **Step 1: Create root layout**

Create `src/routes/+layout.svelte`:

```svelte
<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

{@render children()}
```

- [ ] **Step 2: Create root page (redirect to /lcd)**

Create `src/routes/+page.svelte`:

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/lcd');
	});
</script>
```

- [ ] **Step 3: Create LCD layout**

Create `src/routes/(lcd)/+layout.svelte`:

```svelte
<script lang="ts">
	let { children } = $props();
</script>

<div class="lcd-root w-[1424px] h-[280px] bg-[#07080f] overflow-hidden font-['Inter',system-ui,sans-serif]">
	{@render children()}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #000;
		overflow: hidden;
	}
</style>
```

- [ ] **Step 4: Create LCD page server load function**

Create `src/routes/(lcd)/lcd/+page.server.ts`:

```ts
import type { PageServerLoad } from './$types';
import { loadConfig } from '$lib/server/config';
import { getEnabledModules } from '$lib/modules/registry';

export const load: PageServerLoad = async () => {
	const config = loadConfig();
	const modules = getEnabledModules(config.modules.order, config.modules.enabled);

	return {
		config: config.general,
		modules: modules.map((m) => ({
			id: m.id,
			name: m.name,
			icon: m.icon,
			expandable: m.expandable
		}))
	};
};
```

- [ ] **Step 5: Create LCD shared components**

Create `src/lib/components/lcd/HomeButton.svelte`:

```svelte
<script lang="ts">
	let { onclick } = $props<{ onclick: () => void }>();
</script>

<button
	class="flex items-center justify-center w-14 h-full bg-white/[0.03] border-r border-[#1a2040] cursor-pointer hover:bg-white/[0.06] transition-colors flex-shrink-0 text-2xl"
	{onclick}
>
	🏠
</button>
```

Create `src/lib/components/lcd/AutoReturn.svelte`:

```svelte
<script lang="ts">
	let { seconds, onReturn } = $props<{ seconds: number; onReturn: () => void }>();
	let remaining = $state(seconds);

	$effect(() => {
		remaining = seconds;
		const interval = setInterval(() => {
			remaining--;
			if (remaining <= 0) {
				clearInterval(interval);
				onReturn();
			}
		}, 1000);
		return () => clearInterval(interval);
	});
</script>

<div class="absolute top-1.5 right-3 text-[9px] text-[#333] font-mono">
	⏱ {remaining}s
</div>
```

- [ ] **Step 6: Create LCD home page (strip view)**

Create `src/routes/(lcd)/lcd/+page.svelte`:

```svelte
<script lang="ts">
	import type { PageData } from './$types';
	import RackInfoStrip from '$lib/modules/rack-info/Strip.svelte';
	import UptimeStrip from '$lib/modules/uptime/Strip.svelte';
	import NetworkStrip from '$lib/modules/network/Strip.svelte';
	import TemperatureStrip from '$lib/modules/temperature/Strip.svelte';
	import CoolingStrip from '$lib/modules/cooling/Strip.svelte';
	import UptimeExpanded from '$lib/modules/uptime/Expanded.svelte';
	import NetworkExpanded from '$lib/modules/network/Expanded.svelte';
	import TemperatureExpanded from '$lib/modules/temperature/Expanded.svelte';
	import CoolingExpanded from '$lib/modules/cooling/Expanded.svelte';
	import HomeButton from '$lib/components/lcd/HomeButton.svelte';
	import AutoReturn from '$lib/components/lcd/AutoReturn.svelte';

	let { data }: { data: PageData } = $props();

	const stripComponents: Record<string, typeof RackInfoStrip> = {
		'rack-info': RackInfoStrip,
		'uptime': UptimeStrip,
		'network': NetworkStrip,
		'temperature': TemperatureStrip,
		'cooling': CoolingStrip
	};

	const expandedComponents: Record<string, typeof UptimeExpanded> = {
		'uptime': UptimeExpanded,
		'network': NetworkExpanded,
		'temperature': TemperatureExpanded,
		'cooling': CoolingExpanded
	};

	let expandedModule = $state<string | null>(null);
	let moduleData = $state<Record<string, Record<string, unknown>>>({});

	async function fetchModuleData(id: string) {
		try {
			const res = await fetch(`/api/modules/${id}/data`);
			if (res.ok) {
				moduleData[id] = await res.json();
			}
		} catch (e) {
			console.error(`Failed to fetch data for ${id}:`, e);
		}
	}

	function fetchAllData() {
		for (const mod of data.modules) {
			fetchModuleData(mod.id);
		}
	}

	$effect(() => {
		fetchAllData();
		const interval = setInterval(fetchAllData, 5000);
		return () => clearInterval(interval);
	});

	function expandPanel(id: string) {
		const mod = data.modules.find((m) => m.id === id);
		if (mod?.expandable) {
			expandedModule = id;
		}
	}

	function goHome() {
		expandedModule = null;
	}
</script>

{#if expandedModule}
	<!-- Expanded View -->
	<div class="flex h-full w-full relative">
		<HomeButton onclick={goHome} />
		<AutoReturn seconds={data.config.lcdAutoReturnSeconds} onReturn={goHome} />
		{#if expandedModule === 'uptime'}
			<UptimeExpanded data={moduleData['uptime'] ?? {}} />
		{:else if expandedModule === 'network'}
			<NetworkExpanded data={moduleData['network'] ?? {}} />
		{:else if expandedModule === 'temperature'}
			<TemperatureExpanded data={moduleData['temperature'] ?? {}} />
		{:else if expandedModule === 'cooling'}
			<CoolingExpanded data={moduleData['cooling'] ?? {}} />
		{/if}
	</div>
{:else}
	<!-- Strip View -->
	<div class="flex h-full w-full relative">
		{#each data.modules as mod, i}
			<button
				class="flex items-center justify-center h-full border-r border-[#1a2040] bg-gradient-to-b from-[#0d1120] to-[#090d18] hover:from-[#111830] hover:to-[#0d1120] transition-all cursor-pointer flex-1 min-w-0 text-left"
				class:!bg-gradient-to-b={mod.id === 'rack-info'}
				class:from-[#0f1628]={mod.id === 'rack-info'}
				class:to-[#0a0f1e]={mod.id === 'rack-info'}
				class:!cursor-default={!mod.expandable}
				onclick={() => expandPanel(mod.id)}
			>
				{#if mod.id === 'rack-info'}
					<RackInfoStrip data={moduleData['rack-info'] ?? {}} />
				{:else if mod.id === 'uptime'}
					<UptimeStrip data={moduleData['uptime'] ?? {}} />
				{:else if mod.id === 'network'}
					<NetworkStrip data={moduleData['network'] ?? {}} />
				{:else if mod.id === 'temperature'}
					<TemperatureStrip data={moduleData['temperature'] ?? {}} />
				{:else if mod.id === 'cooling'}
					<CoolingStrip data={moduleData['cooling'] ?? {}} />
				{/if}
			</button>
		{/each}
		<!-- Bottom accent line -->
		<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#7dd3fc44] via-[#4ade8044] to-[#7dd3fc22]"></div>
	</div>
{/if}
```

- [ ] **Step 7: Commit**

```bash
git add src/routes/ src/lib/components/
git commit -m "feat: add LCD layout, root redirect, and strip/expanded page"
```

---

### Task 8: LCD Strip Components (All 5 Modules)

**Files:**
- Create: `src/lib/modules/rack-info/Strip.svelte`, `src/lib/modules/uptime/Strip.svelte`, `src/lib/modules/network/Strip.svelte`, `src/lib/modules/temperature/Strip.svelte`, `src/lib/modules/cooling/Strip.svelte`

- [ ] **Step 1: Create Rack Info strip**

Create `src/lib/modules/rack-info/Strip.svelte`:

```svelte
<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();
	const rackName = $derived((data.rackName as string) ?? 'HOME-LAB');
	const rackSubtitle = $derived((data.rackSubtitle as string) ?? '');
</script>

<div class="text-center px-7">
	<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-1">Server Rack</div>
	<div class="text-[26px] font-bold text-[#7dd3fc] tracking-wide leading-none">{rackName}</div>
	{#if rackSubtitle}
		<div class="text-[11px] text-[#334170] mt-1">{rackSubtitle}</div>
	{/if}
</div>
```

- [ ] **Step 2: Create Uptime strip**

Create `src/lib/modules/uptime/Strip.svelte`:

```svelte
<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();
	const days = $derived((data.days as number) ?? 0);
	const hours = $derived((data.hours as number) ?? 0);
	const minutes = $derived((data.minutes as number) ?? 0);
</script>

<div class="text-center px-6">
	<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-1.5">Uptime</div>
	<div class="flex items-baseline justify-center gap-1">
		<span class="text-[32px] font-bold text-[#e2e8f0] leading-none">{days}</span>
		<span class="text-[13px] text-[#4a5580] mr-1.5">days</span>
		<span class="text-[32px] font-bold text-[#e2e8f0] leading-none">{hours}</span>
		<span class="text-[13px] text-[#4a5580] mr-1.5">hrs</span>
		<span class="text-[22px] font-semibold text-[#94a3b8] leading-none">{minutes}</span>
		<span class="text-[11px] text-[#4a5580]">min</span>
	</div>
</div>
```

- [ ] **Step 3: Create Network strip**

Create `src/lib/modules/network/Strip.svelte`:

```svelte
<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();

	const txRate = $derived((data.txRate as number) ?? 0);
	const rxRate = $derived((data.rxRate as number) ?? 0);
	const history = $derived((data.history as { rxRate: number; txRate: number }[]) ?? []);

	function formatRate(bytesPerSec: number): { value: string; unit: string } {
		if (bytesPerSec >= 1_000_000) return { value: (bytesPerSec / 1_000_000).toFixed(1), unit: 'MB/s' };
		if (bytesPerSec >= 1_000) return { value: (bytesPerSec / 1_000).toFixed(1), unit: 'KB/s' };
		return { value: bytesPerSec.toString(), unit: 'B/s' };
	}

	const tx = $derived(formatRate(txRate));
	const rx = $derived(formatRate(rxRate));

	function sparklinePath(values: number[], height: number): string {
		if (values.length < 2) return '';
		const max = Math.max(...values, 1);
		const step = 120 / (values.length - 1);
		return values.map((v, i) => `${i * step},${height - (v / max) * height}`).join(' ');
	}
</script>

<div class="flex items-center px-5 gap-4">
	<div class="flex-shrink-0">
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2">Network</div>
		<div class="mb-1">
			<span class="text-[#4ade80] text-[11px] font-medium">▲</span>
			<span class="text-[20px] font-bold text-[#e2e8f0] mx-0.5">{tx.value}</span>
			<span class="text-[10px] text-[#4a5580]">{tx.unit}</span>
		</div>
		<div>
			<span class="text-[#60a5fa] text-[11px] font-medium">▼</span>
			<span class="text-[20px] font-bold text-[#e2e8f0] mx-0.5">{rx.value}</span>
			<span class="text-[10px] text-[#4a5580]">{rx.unit}</span>
		</div>
	</div>
	<!-- Sparkline -->
	<div class="flex-1 h-[70%]">
		<svg width="100%" height="100%" viewBox="0 0 120 50" preserveAspectRatio="none">
			{#if history.length >= 2}
				<polyline
					points={sparklinePath(history.map((h) => h.txRate), 50)}
					fill="none"
					stroke="#4ade80"
					stroke-width="1.5"
				/>
				<polyline
					points={sparklinePath(history.map((h) => h.rxRate), 50)}
					fill="none"
					stroke="#60a5fa"
					stroke-width="1.2"
					opacity="0.6"
				/>
			{/if}
		</svg>
	</div>
</div>
```

- [ ] **Step 4: Create Temperature strip**

Create `src/lib/modules/temperature/Strip.svelte`:

```svelte
<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();

	const current = $derived((data.current as number | null) ?? null);
	const high = $derived((data.high as number | null) ?? null);
	const history = $derived((data.history as { timestamp: number; value: number }[]) ?? []);

	function sparklinePath(values: number[]): string {
		if (values.length < 2) return '';
		const min = Math.min(...values) - 2;
		const max = Math.max(...values) + 2;
		const range = max - min || 1;
		const step = 100 / (values.length - 1);
		return values.map((v, i) => `${i * step},${40 - ((v - min) / range) * 40}`).join(' ');
	}
</script>

<div class="flex items-center px-5 gap-3.5">
	<div class="flex-shrink-0">
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2">Temperature</div>
		<div class="flex items-baseline gap-0.5">
			{#if current !== null}
				<span class="text-[34px] font-bold text-[#fb923c] leading-none">{Math.round(current)}</span>
				<span class="text-[16px] text-[#9a5c2e] font-medium">°C</span>
			{:else}
				<span class="text-[24px] text-[#4a5580]">--</span>
			{/if}
		</div>
		{#if high !== null}
			<div class="text-[9px] text-[#4a5580] mt-1">▲ {high}° peak</div>
		{/if}
	</div>
	<!-- Mini 24h chart -->
	<div class="flex-1 h-[65%] max-w-[140px]">
		<svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
			{#if history.length >= 2}
				<polyline
					points={sparklinePath(history.map((h) => h.value))}
					fill="none"
					stroke="#fb923c"
					stroke-width="1.5"
				/>
			{/if}
		</svg>
	</div>
</div>
```

- [ ] **Step 5: Create Cooling strip**

Create `src/lib/modules/cooling/Strip.svelte`:

```svelte
<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();
	const isOn = $derived((data.on as boolean) ?? false);
</script>

<div class="text-center px-6">
	<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2">Cooling</div>
	<div class="text-[28px] mb-1">❄️</div>
	<div
		class="inline-block px-3 py-0.5 rounded-full text-[13px] font-semibold"
		class:bg-[#4ade8020]={isOn}
		class:border-[#4ade8040]={isOn}
		class:text-[#4ade80]={isOn}
		class:bg-[#ef444420]={!isOn}
		class:border-[#ef444440]={!isOn}
		class:text-[#ef4444]={!isOn}
		class:border={true}
	>
		{isOn ? 'ON' : 'OFF'}
	</div>
</div>
```

- [ ] **Step 6: Verify LCD dashboard renders in browser**

Run: `npm run dev -- --host 0.0.0.0 --port 3000`

Open http://localhost:3000/lcd — should show the dark strip with all 5 panels.

- [ ] **Step 7: Commit**

```bash
git add src/lib/modules/*/Strip.svelte
git commit -m "feat: add LCD strip components for all modules"
```

---

### Task 9: LCD Expanded Views

**Files:**
- Create: `src/lib/modules/uptime/Expanded.svelte`, `src/lib/modules/network/Expanded.svelte`, `src/lib/modules/temperature/Expanded.svelte`, `src/lib/modules/cooling/Expanded.svelte`

- [ ] **Step 1: Create Uptime expanded view**

Create `src/lib/modules/uptime/Expanded.svelte`:

```svelte
<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();
	const days = $derived((data.days as number) ?? 0);
	const hours = $derived((data.hours as number) ?? 0);
	const minutes = $derived((data.minutes as number) ?? 0);
	const totalSeconds = $derived((data.totalSeconds as number) ?? 0);
</script>

<div class="flex-1 flex items-center justify-center gap-16 text-[#e2e8f0]">
	<div>
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-3">System Uptime</div>
		<div class="flex items-baseline gap-2">
			<span class="text-[48px] font-bold leading-none">{days}</span>
			<span class="text-[16px] text-[#4a5580]">days</span>
			<span class="text-[48px] font-bold leading-none">{hours}</span>
			<span class="text-[16px] text-[#4a5580]">hrs</span>
			<span class="text-[36px] font-semibold text-[#94a3b8] leading-none">{minutes}</span>
			<span class="text-[14px] text-[#4a5580]">min</span>
		</div>
	</div>
	<div class="w-px h-[60%] bg-gradient-to-b from-transparent via-[#1a2040] to-transparent"></div>
	<div class="text-[12px] text-[#4a5580] leading-relaxed">
		<div>Total: <span class="text-[#94a3b8]">{Math.floor(totalSeconds / 3600).toLocaleString()} hours</span></div>
	</div>
</div>
```

- [ ] **Step 2: Create Network expanded view**

Create `src/lib/modules/network/Expanded.svelte`:

```svelte
<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();

	const txRate = $derived((data.txRate as number) ?? 0);
	const rxRate = $derived((data.rxRate as number) ?? 0);
	const history = $derived((data.history as { rxRate: number; txRate: number }[]) ?? []);

	function formatRate(bytesPerSec: number): string {
		if (bytesPerSec >= 1_000_000) return `${(bytesPerSec / 1_000_000).toFixed(1)} MB/s`;
		if (bytesPerSec >= 1_000) return `${(bytesPerSec / 1_000).toFixed(1)} KB/s`;
		return `${bytesPerSec} B/s`;
	}

	function graphPath(values: number[], viewWidth: number, viewHeight: number): string {
		if (values.length < 2) return '';
		const max = Math.max(...values, 1);
		const step = viewWidth / (values.length - 1);
		return values.map((v, i) => `${i * step},${viewHeight - (v / max) * viewHeight * 0.85}`).join(' ');
	}

	function fillPath(values: number[], viewWidth: number, viewHeight: number): string {
		const line = graphPath(values, viewWidth, viewHeight);
		if (!line) return '';
		return `${line} ${viewWidth},${viewHeight} 0,${viewHeight}`;
	}

	const peakTx = $derived(history.length > 0 ? Math.max(...history.map((h) => h.txRate)) : 0);
	const peakRx = $derived(history.length > 0 ? Math.max(...history.map((h) => h.rxRate)) : 0);
</script>

<div class="flex-1 flex items-center px-5 gap-4">
	<!-- Stats -->
	<div class="flex-shrink-0 min-w-[140px]">
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2">Network</div>
		<div class="mb-2">
			<span class="text-[#4ade80] text-[12px]">▲ Upload</span>
			<div><span class="text-[22px] font-bold text-[#e2e8f0]">{formatRate(txRate)}</span></div>
		</div>
		<div>
			<span class="text-[#60a5fa] text-[12px]">▼ Download</span>
			<div><span class="text-[22px] font-bold text-[#e2e8f0]">{formatRate(rxRate)}</span></div>
		</div>
	</div>

	<!-- Graph -->
	<div class="flex-1 h-[80%] bg-white/[0.02] rounded-lg p-2 relative overflow-hidden">
		<svg width="100%" height="100%" viewBox="0 0 400 60" preserveAspectRatio="none">
			<!-- Grid lines -->
			{#each [15, 30, 45] as y}
				<line x1="0" y1={y} x2="400" y2={y} stroke="white" stroke-opacity="0.03" stroke-width="0.5" />
			{/each}
			<!-- Upload fill + line -->
			<polygon points={fillPath(history.map((h) => h.txRate), 400, 60)} fill="#4ade80" opacity="0.1" />
			<polyline points={graphPath(history.map((h) => h.txRate), 400, 60)} fill="none" stroke="#4ade80" stroke-width="2" />
			<!-- Download line -->
			<polyline points={graphPath(history.map((h) => h.rxRate), 400, 60)} fill="none" stroke="#60a5fa" stroke-width="1.5" opacity="0.7" />
		</svg>
	</div>

	<!-- Peak stats -->
	<div class="flex-shrink-0 ml-4 text-[11px] space-y-1.5">
		<div><span class="text-[#4a5580]">Peak ▲</span> <span class="text-[#4ade80] font-semibold">{formatRate(peakTx)}</span></div>
		<div><span class="text-[#4a5580]">Peak ▼</span> <span class="text-[#60a5fa] font-semibold">{formatRate(peakRx)}</span></div>
	</div>
</div>
```

- [ ] **Step 3: Create Temperature expanded view**

Create `src/lib/modules/temperature/Expanded.svelte`:

```svelte
<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();

	const current = $derived((data.current as number | null) ?? null);
	const high = $derived((data.high as number | null) ?? null);
	const low = $derived((data.low as number | null) ?? null);
	const avg = $derived((data.avg as number | null) ?? null);
	const dangerThreshold = $derived((data.dangerThreshold as number) ?? 45);
	const history = $derived((data.history as { timestamp: number; value: number }[]) ?? []);

	function graphPath(values: number[]): string {
		if (values.length < 2) return '';
		const min = Math.min(...values) - 3;
		const max = Math.max(...values, dangerThreshold) + 3;
		const range = max - min || 1;
		const step = 600 / (values.length - 1);
		return values.map((v, i) => `${i * step},${80 - ((v - min) / range) * 75}`).join(' ');
	}

	function dangerY(values: number[]): number {
		if (values.length === 0) return 10;
		const min = Math.min(...values) - 3;
		const max = Math.max(...values, dangerThreshold) + 3;
		const range = max - min || 1;
		return 80 - ((dangerThreshold - min) / range) * 75;
	}
</script>

<div class="flex-1 flex items-stretch">
	<!-- Stats column -->
	<div class="flex flex-col justify-center px-5 flex-shrink-0 min-w-[140px] border-r border-[#1a2040]">
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2">Temperature</div>
		<div class="flex items-baseline gap-0.5 mb-2.5">
			{#if current !== null}
				<span class="text-[38px] font-bold text-[#fb923c] leading-none">{current.toFixed(1)}</span>
				<span class="text-[18px] text-[#9a5c2e]">°C</span>
			{:else}
				<span class="text-[28px] text-[#4a5580]">--</span>
			{/if}
		</div>
		<div class="text-[10px] text-[#4a5580] leading-relaxed space-y-0.5">
			<div>▲ High: <span class="text-[#ef4444]">{high !== null ? `${high}°` : '--'}</span></div>
			<div>▼ Low: <span class="text-[#60a5fa]">{low !== null ? `${low}°` : '--'}</span></div>
			<div>⌀ Avg: <span class="text-[#94a3b8]">{avg !== null ? `${avg}°` : '--'}</span></div>
		</div>
	</div>

	<!-- 24h graph -->
	<div class="flex-1 flex flex-col px-4 py-2.5">
		<div class="flex-1 relative">
			<svg width="100%" height="100%" viewBox="0 0 600 80" preserveAspectRatio="none">
				<!-- Grid -->
				{#each [16, 32, 48, 64] as y}
					<line x1="0" y1={y} x2="600" y2={y} stroke="white" stroke-opacity="0.025" stroke-width="0.5" />
				{/each}
				<!-- Danger zone -->
				{#if history.length > 0}
					<line x1="0" y1={dangerY(history.map((h) => h.value))} x2="600" y2={dangerY(history.map((h) => h.value))} stroke="#ef4444" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.3" />
				{/if}
				<!-- Temp line -->
				<polyline
					points={graphPath(history.map((h) => h.value))}
					fill="none"
					stroke="#fb923c"
					stroke-width="2"
				/>
			</svg>
		</div>
		<!-- Time axis -->
		<div class="flex justify-between text-[8px] text-[#333] pt-0.5">
			<span>24h ago</span><span>20h</span><span>16h</span><span>12h</span><span>8h</span><span>4h</span><span>now</span>
		</div>
	</div>
</div>
```

- [ ] **Step 4: Create Cooling expanded view**

Create `src/lib/modules/cooling/Expanded.svelte`:

```svelte
<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();

	const isOn = $derived((data.on as boolean) ?? false);
	const relays = $derived((data.relays as boolean[]) ?? [false, false, false, false]);
	const gpioAvailable = $derived((data.gpioAvailable as boolean) ?? false);

	async function toggleCooling() {
		try {
			const res = await fetch('/api/modules/cooling/action', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'toggle' })
			});
			if (!res.ok) console.error('Failed to toggle cooling');
		} catch (e) {
			console.error('Toggle error:', e);
		}
	}
</script>

<div class="flex-1 flex items-center justify-center gap-10">
	<div class="text-center">
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2.5">Rack Cooling</div>
		<div class="text-[48px] leading-none">❄️</div>
	</div>

	<!-- Toggle -->
	<button class="cursor-pointer" onclick={toggleCooling}>
		<div
			class="w-[100px] h-[48px] rounded-full relative transition-colors"
			class:bg-[#4ade80]={isOn}
			class:shadow-[0_0_20px_rgba(74,222,128,0.3)]={isOn}
			class:bg-[#333]={!isOn}
		>
			<div
				class="w-[42px] h-[42px] rounded-full bg-white absolute top-[3px] shadow-md transition-all"
				class:right-[3px]={isOn}
				class:left-[3px]={!isOn}
			></div>
		</div>
		<div
			class="text-center mt-2 text-[16px] font-bold tracking-[2px]"
			class:text-[#4ade80]={isOn}
			class:text-[#666]={!isOn}
		>
			{isOn ? 'ON' : 'OFF'}
		</div>
	</button>

	<div class="w-px h-[60%] bg-gradient-to-b from-transparent via-[#1a2040] to-transparent"></div>

	<!-- Relay status -->
	<div>
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2.5">Relay Status</div>
		<div class="flex gap-3">
			{#each relays as state, i}
				<div class="text-center">
					<div
						class="w-3.5 h-3.5 rounded-full mx-auto mb-1"
						class:bg-[#4ade80]={state}
						class:shadow-[0_0_8px_#4ade8066]={state}
						class:bg-[#333]={!state}
					></div>
					<div class="text-[8px] text-[#4a5580]">R{i + 1}</div>
				</div>
			{/each}
		</div>
		{#if !gpioAvailable}
			<div class="text-[8px] text-[#ef4444] mt-2">GPIO unavailable</div>
		{/if}
	</div>
</div>
```

- [ ] **Step 5: Verify expanded views work**

Run: `npm run dev -- --host 0.0.0.0 --port 3000`

Open http://localhost:3000/lcd. Click on Uptime, Network, Temperature, or Cooling panels — each should expand to full screen with a home button and auto-return timer.

- [ ] **Step 6: Commit**

```bash
git add src/lib/modules/*/Expanded.svelte
git commit -m "feat: add LCD expanded views for all expandable modules"
```

---

### Task 10: Config Dashboard

**Files:**
- Create: `src/routes/(config)/+layout.svelte`, `src/routes/(config)/config/+page.svelte`, `src/routes/(config)/config/+page.server.ts`, `src/lib/modules/*/Config.svelte`

- [ ] **Step 1: Create Config layout**

Create `src/routes/(config)/+layout.svelte`:

```svelte
<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen bg-[#0f1117] text-[#e2e8f0] font-['Inter',system-ui,sans-serif]">
	<header class="border-b border-[#1e2333] px-6 py-4">
		<h1 class="text-xl font-bold text-[#7dd3fc]">PiRack Control</h1>
		<p class="text-sm text-[#4a5580]">Configuration Dashboard</p>
	</header>
	<main class="max-w-4xl mx-auto p-6">
		{@render children()}
	</main>
</div>
```

- [ ] **Step 2: Create Config page server load**

Create `src/routes/(config)/config/+page.server.ts`:

```ts
import type { PageServerLoad } from './$types';
import { loadConfig } from '$lib/server/config';
import { registry } from '$lib/modules/registry';

export const load: PageServerLoad = async () => {
	const config = loadConfig();
	return {
		config,
		availableModules: registry.map((m) => ({
			id: m.id,
			name: m.name,
			icon: m.icon
		}))
	};
};
```

- [ ] **Step 3: Create module Config components**

Create `src/lib/modules/rack-info/Config.svelte`:

```svelte
<script lang="ts">
	let { settings = $bindable({}) } = $props<{ settings: Record<string, unknown> }>();
</script>

<p class="text-sm text-[#4a5580]">Rack name and subtitle are configured in General Settings above.</p>
```

Create `src/lib/modules/uptime/Config.svelte`:

```svelte
<p class="text-sm text-[#4a5580]">No configuration needed for the uptime module.</p>
```

Create `src/lib/modules/network/Config.svelte`:

```svelte
<script lang="ts">
	let { settings = $bindable({}) } = $props<{ settings: Record<string, unknown> }>();
	let refreshInterval = $derived((settings.refreshInterval as number) ?? 5000);
</script>

<label class="block mb-3">
	<span class="text-sm text-[#94a3b8]">Refresh Interval (ms)</span>
	<input
		type="number"
		class="mt-1 block w-full bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-2 text-sm text-[#e2e8f0]"
		value={refreshInterval}
		oninput={(e) => { settings.refreshInterval = parseInt(e.currentTarget.value, 10); }}
		min="1000"
		step="1000"
	/>
</label>
```

Create `src/lib/modules/temperature/Config.svelte`:

```svelte
<script lang="ts">
	let { settings = $bindable({}) } = $props<{ settings: Record<string, unknown> }>();
	let dangerThreshold = $derived((settings.dangerThreshold as number) ?? 45);
	let refreshInterval = $derived((settings.refreshInterval as number) ?? 10000);
</script>

<label class="block mb-3">
	<span class="text-sm text-[#94a3b8]">Danger Threshold (°C)</span>
	<input
		type="number"
		class="mt-1 block w-full bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-2 text-sm text-[#e2e8f0]"
		value={dangerThreshold}
		oninput={(e) => { settings.dangerThreshold = parseInt(e.currentTarget.value, 10); }}
		min="20"
		max="80"
	/>
</label>
<label class="block mb-3">
	<span class="text-sm text-[#94a3b8]">Refresh Interval (ms)</span>
	<input
		type="number"
		class="mt-1 block w-full bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-2 text-sm text-[#e2e8f0]"
		value={refreshInterval}
		oninput={(e) => { settings.refreshInterval = parseInt(e.currentTarget.value, 10); }}
		min="1000"
		step="1000"
	/>
</label>
```

Create `src/lib/modules/cooling/Config.svelte`:

```svelte
<script lang="ts">
	let { settings = $bindable({}) } = $props<{ settings: Record<string, unknown> }>();
	let relayLabels = $derived((settings.relayLabels as string[]) ?? ['R1', 'R2', 'R3', 'R4']);
</script>

<div class="space-y-2">
	<span class="text-sm text-[#94a3b8]">Relay Labels</span>
	{#each relayLabels as label, i}
		<label class="flex items-center gap-2">
			<span class="text-xs text-[#4a5580] w-16">Relay {i + 1}:</span>
			<input
				type="text"
				class="bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-1.5 text-sm text-[#e2e8f0] w-32"
				value={label}
				oninput={(e) => {
					const newLabels = [...relayLabels];
					newLabels[i] = e.currentTarget.value;
					settings.relayLabels = newLabels;
				}}
			/>
		</label>
	{/each}
</div>
```

- [ ] **Step 4: Create Config main page**

Create `src/routes/(config)/config/+page.svelte`:

```svelte
<script lang="ts">
	import type { PageData } from './$types';
	import RackInfoConfig from '$lib/modules/rack-info/Config.svelte';
	import UptimeConfig from '$lib/modules/uptime/Config.svelte';
	import NetworkConfig from '$lib/modules/network/Config.svelte';
	import TemperatureConfig from '$lib/modules/temperature/Config.svelte';
	import CoolingConfig from '$lib/modules/cooling/Config.svelte';

	let { data }: { data: PageData } = $props();

	let config = $state(structuredClone(data.config));
	let saving = $state(false);
	let saved = $state(false);
	let expandedModule = $state<string | null>(null);

	const configComponents: Record<string, typeof RackInfoConfig> = {
		'rack-info': RackInfoConfig,
		'uptime': UptimeConfig,
		'network': NetworkConfig,
		'temperature': TemperatureConfig,
		'cooling': CoolingConfig
	};

	async function save() {
		saving = true;
		saved = false;
		try {
			const res = await fetch('/api/config', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(config)
			});
			if (res.ok) saved = true;
		} finally {
			saving = false;
			setTimeout(() => { saved = false; }, 2000);
		}
	}

	function toggleModule(id: string) {
		const idx = config.modules.enabled.indexOf(id);
		if (idx >= 0) {
			config.modules.enabled = config.modules.enabled.filter((m: string) => m !== id);
		} else {
			config.modules.enabled = [...config.modules.enabled, id];
		}
	}

	function moveModule(id: string, direction: -1 | 1) {
		const order = [...config.modules.order];
		const idx = order.indexOf(id);
		const newIdx = idx + direction;
		if (newIdx < 0 || newIdx >= order.length) return;
		[order[idx], order[newIdx]] = [order[newIdx], order[idx]];
		config.modules.order = order;
	}
</script>

<!-- General Settings -->
<section class="mb-8">
	<h2 class="text-lg font-semibold mb-4 text-[#e2e8f0]">General Settings</h2>
	<div class="bg-[#161a26] rounded-lg p-5 space-y-4">
		<label class="block">
			<span class="text-sm text-[#94a3b8]">Rack Name</span>
			<input
				type="text"
				class="mt-1 block w-full bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-2 text-sm text-[#e2e8f0]"
				bind:value={config.general.rackName}
			/>
		</label>
		<label class="block">
			<span class="text-sm text-[#94a3b8]">Rack Subtitle</span>
			<input
				type="text"
				class="mt-1 block w-full bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-2 text-sm text-[#e2e8f0]"
				bind:value={config.general.rackSubtitle}
			/>
		</label>
		<label class="block">
			<span class="text-sm text-[#94a3b8]">LCD Auto-Return (seconds)</span>
			<input
				type="number"
				class="mt-1 block w-full bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-2 text-sm text-[#e2e8f0]"
				bind:value={config.general.lcdAutoReturnSeconds}
				min="10"
				max="300"
			/>
		</label>
	</div>
</section>

<!-- Modules -->
<section class="mb-8">
	<h2 class="text-lg font-semibold mb-4 text-[#e2e8f0]">Modules</h2>
	<div class="space-y-3">
		{#each config.modules.order as moduleId, i}
			{@const mod = data.availableModules.find((m) => m.id === moduleId)}
			{#if mod}
				<div class="bg-[#161a26] rounded-lg overflow-hidden">
					<div class="flex items-center px-5 py-3 gap-4">
						<!-- Reorder buttons -->
						<div class="flex flex-col gap-0.5">
							<button class="text-[#4a5580] hover:text-[#7dd3fc] text-xs" onclick={() => moveModule(moduleId, -1)} disabled={i === 0}>▲</button>
							<button class="text-[#4a5580] hover:text-[#7dd3fc] text-xs" onclick={() => moveModule(moduleId, 1)} disabled={i === config.modules.order.length - 1}>▼</button>
						</div>
						<!-- Module info -->
						<span class="text-xl">{mod.icon}</span>
						<span class="font-medium flex-1">{mod.name}</span>
						<!-- Enable toggle -->
						<button
							class="w-10 h-5 rounded-full relative transition-colors"
							class:bg-[#4ade80]={config.modules.enabled.includes(moduleId)}
							class:bg-[#333]={!config.modules.enabled.includes(moduleId)}
							onclick={() => toggleModule(moduleId)}
						>
							<div
								class="w-4 h-4 rounded-full bg-white absolute top-0.5 shadow transition-all"
								class:right-0.5={config.modules.enabled.includes(moduleId)}
								class:left-0.5={!config.modules.enabled.includes(moduleId)}
							></div>
						</button>
						<!-- Expand settings -->
						<button
							class="text-sm text-[#4a5580] hover:text-[#7dd3fc]"
							onclick={() => expandedModule = expandedModule === moduleId ? null : moduleId}
						>
							{expandedModule === moduleId ? '▼' : '▶'} Settings
						</button>
					</div>
					{#if expandedModule === moduleId}
						<div class="px-5 pb-4 pt-2 border-t border-[#1e2333]">
							{#if moduleId === 'rack-info'}
								<RackInfoConfig bind:settings={config.modules.settings['rack-info']} />
							{:else if moduleId === 'uptime'}
								<UptimeConfig />
							{:else if moduleId === 'network'}
								<NetworkConfig bind:settings={config.modules.settings['network']} />
							{:else if moduleId === 'temperature'}
								<TemperatureConfig bind:settings={config.modules.settings['temperature']} />
							{:else if moduleId === 'cooling'}
								<CoolingConfig bind:settings={config.modules.settings['cooling']} />
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		{/each}
	</div>
</section>

<!-- Save button -->
<div class="flex items-center gap-4">
	<button
		class="px-6 py-2.5 bg-[#7dd3fc] text-[#0a0a1a] font-semibold rounded-lg hover:bg-[#5bbce6] transition-colors disabled:opacity-50"
		onclick={save}
		disabled={saving}
	>
		{saving ? 'Saving...' : 'Save Configuration'}
	</button>
	{#if saved}
		<span class="text-sm text-[#4ade80]">✓ Saved</span>
	{/if}
</div>
```

- [ ] **Step 5: Verify config dashboard**

Run: `npm run dev -- --host 0.0.0.0 --port 3000`

Open http://localhost:3000/config — should show general settings, module list with reorder/toggle, and per-module settings. Save should persist to config.json.

- [ ] **Step 6: Commit**

```bash
git add src/routes/\(config\)/ src/lib/modules/*/Config.svelte
git commit -m "feat: add config dashboard with module management"
```

---

### Task 11: Docker Setup

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`

- [ ] **Step 1: Create Dockerfile**

Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:20-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-slim AS runtime

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

ENV PORT=3000
ENV DATA_DIR=/app/data

EXPOSE 3000

CMD ["node", "build"]
```

- [ ] **Step 2: Create docker-compose.yml**

Create `docker-compose.yml`:

```yaml
services:
  pirack-control:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    devices:
      - /dev/gpiomem:/dev/gpiomem
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATA_DIR=/app/data
    restart: unless-stopped
```

- [ ] **Step 3: Create .dockerignore**

Create `.dockerignore`:

```
node_modules
build
.svelte-kit
.firecrawl
.superpowers
.git
data
docs
tests
*.md
```

- [ ] **Step 4: Verify Docker build succeeds**

Run: `docker build -t pirack-control .`

Expected: Build completes successfully.

- [ ] **Step 5: Verify Docker Compose runs**

Run: `docker compose up -d`

Then: `curl http://localhost:3000/api/modules`

Expected: JSON response with module list.

Run: `docker compose down`

- [ ] **Step 6: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore
git commit -m "feat: add Docker and docker-compose for deployment"
```

---

### Task 12: Final Polish and Verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 2: Run type check**

Run: `npx svelte-check --tsconfig ./tsconfig.json`

Fix any type errors that appear.

- [ ] **Step 3: Verify full flow**

Run: `npm run dev -- --host 0.0.0.0 --port 3000`

1. Open http://localhost:3000/lcd — verify strip view shows all panels
2. Click each expandable panel — verify expanded views render with home button and timer
3. Open http://localhost:3000/config — verify config form loads
4. Change rack name, save, refresh LCD — verify name updates
5. Toggle a module off, save, refresh LCD — verify panel disappears

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final polish and verification"
```
