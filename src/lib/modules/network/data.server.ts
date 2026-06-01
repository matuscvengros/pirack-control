import os from 'os';
import fs from 'fs';
import type { ModuleConfig, ModuleData, UdmConnection } from '$lib/modules/types';
import { fetchWanRates, type WanRates } from '$lib/server/udm';
import type { RateUnits } from './format';

const MAX_HISTORY = 60;

interface RatePoint {
	timestamp: number;
	rxRate: number;
	txRate: number;
}

function resolveUnits(config: ModuleConfig): RateUnits {
	return config.units === 'bytes' ? 'bytes' : 'bits';
}

// ---------------------------------------------------------------------------
// Local mode — measures the Pi's own NIC via /proc/net/dev. Used as the
// fallback when no UDM source is configured. Behaviour is unchanged from the
// original module: one sample is taken per getData() call.
// ---------------------------------------------------------------------------

interface NetSample {
	timestamp: number;
	rxBytes: number;
	txBytes: number;
}

let lastSample: NetSample | null = null;
const localHistory: RatePoint[] = [];

function getNetworkBytes(): { rxBytes: number; txBytes: number } {
	try {
		const raw = fs.readFileSync('/proc/net/dev', 'utf-8');
		const lines = raw.split('\n').slice(2);
		let rxTotal = 0;
		let txTotal = 0;
		for (const line of lines) {
			const parts = line.trim().split(/\s+/);
			if (parts.length < 10) continue;
			const iface = parts[0].replace(':', '');
			if (iface === 'lo') continue;
			rxTotal += parseInt(parts[1], 10);
			txTotal += parseInt(parts[9], 10);
		}
		return { rxBytes: rxTotal, txBytes: txTotal };
	} catch {
		return { rxBytes: 0, txBytes: 0 };
	}
}

function getLocalData(units: RateUnits, extra: Record<string, unknown> = {}): ModuleData {
	const now = Date.now();
	const current = getNetworkBytes();
	let rxRate = 0;
	let txRate = 0;

	if (lastSample) {
		const elapsed = (now - lastSample.timestamp) / 1000;
		if (elapsed > 0) {
			const rawRx = (current.rxBytes - lastSample.rxBytes) / elapsed;
			const rawTx = (current.txBytes - lastSample.txBytes) / elapsed;
			// Guard against negative rates from counter wrap or system restart
			rxRate = rawRx >= 0 ? rawRx : 0;
			txRate = rawTx >= 0 ? rawTx : 0;
		}
	}

	lastSample = { timestamp: now, ...current };
	localHistory.push({ timestamp: now, rxRate, txRate });
	if (localHistory.length > MAX_HISTORY) localHistory.shift();

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
		source: 'local',
		units,
		rxRate: Math.round(rxRate),
		txRate: Math.round(txRate),
		primaryIp,
		history: localHistory.map((h) => ({
			timestamp: h.timestamp,
			rxRate: Math.round(h.rxRate),
			txRate: Math.round(h.txRate)
		})),
		...extra
	};
}

// ---------------------------------------------------------------------------
// UDM mode — polls the UniFi console for total internet (WAN) throughput on its own
// timer (independent of the dashboard's refresh), keeping a rolling history.
// ---------------------------------------------------------------------------

const UDM_MAX_HISTORY = 120;

interface UdmPollerConfig {
	host: string;
	apiKey: string;
	site: string;
	intervalMs: number;
	insecureTLS: boolean;
}

interface UdmState {
	key: string;
	timer: ReturnType<typeof setInterval> | null;
	history: RatePoint[];
	latest: WanRates | null;
	lastError: string | null;
	lastOk: number | null;
}

let udm: UdmState | null = null;

function pollerKey(cfg: UdmPollerConfig): string {
	return [cfg.host, cfg.site, cfg.intervalMs, cfg.insecureTLS, cfg.apiKey ? 'k' : '-'].join('|');
}

async function pollOnce(cfg: UdmPollerConfig): Promise<void> {
	if (!udm) return;
	try {
		const rates = await fetchWanRates({
			host: cfg.host,
			apiKey: cfg.apiKey,
			site: cfg.site,
			insecureTLS: cfg.insecureTLS
		});
		udm.latest = rates;
		udm.lastError = null;
		udm.lastOk = Date.now();
		udm.history.push({
			timestamp: Date.now(),
			rxRate: Math.round(rates.rxRate),
			txRate: Math.round(rates.txRate)
		});
		while (udm.history.length > UDM_MAX_HISTORY) udm.history.shift();
	} catch (e) {
		udm.lastError = (e as Error).message;
	}
}

function ensurePoller(cfg: UdmPollerConfig): void {
	const key = pollerKey(cfg);
	if (udm && udm.key === key) return;

	// Config changed (or first run) — (re)start the poller.
	if (udm?.timer) clearInterval(udm.timer);
	udm = { key, timer: null, history: [], latest: null, lastError: null, lastOk: null };

	void pollOnce(cfg);
	const interval = Math.max(500, cfg.intervalMs);
	udm.timer = setInterval(() => void pollOnce(cfg), interval);
	// Don't keep the process (or test runner) alive just for polling.
	udm.timer.unref?.();
}

function getUdmData(config: ModuleConfig, conn: UdmConnection, units: RateUnits): ModuleData {
	// The gateway connection is shared (resolved from the config page or `.env`);
	// the module config only carries presentation/poll behaviour. Named `conn` so it
	// doesn't shadow the module-level `udm` poller state used below.
	const { host, apiKey, site, insecureTLS } = conn;

	if (!host || !apiKey) {
		return {
			source: 'udm',
			units,
			configured: false,
			connected: false,
			error: !host ? 'WAN host not set' : 'API key not set',
			rxRate: 0,
			txRate: 0,
			wanIp: '',
			primaryIp: '',
			latency: null,
			history: []
		};
	}

	ensurePoller({
		host,
		apiKey,
		site,
		intervalMs: typeof config.pollIntervalMs === 'number' ? config.pollIntervalMs : 3000,
		insecureTLS
	});

	const latest = udm?.latest ?? null;
	return {
		source: 'udm',
		units,
		configured: true,
		connected: udm?.lastError == null && latest != null,
		error: udm?.lastError ?? null,
		rxRate: latest ? Math.round(latest.rxRate) : 0,
		txRate: latest ? Math.round(latest.txRate) : 0,
		wanIp: latest?.wanIp ?? '',
		primaryIp: latest?.wanIp ?? '',
		latency: latest?.latency ?? null,
		isp: latest?.isp ?? '',
		history: (udm?.history ?? []).map((h) => ({
			timestamp: h.timestamp,
			rxRate: h.rxRate,
			txRate: h.txRate
		}))
	};
}

const EMPTY_CONNECTION: UdmConnection = { host: '', apiKey: '', site: 'default', insecureTLS: true };

export async function getData(config: ModuleConfig, conn?: UdmConnection): Promise<ModuleData> {
	const units = resolveUnits(config);
	// `undefined`/unknown source falls back to local so the legacy NIC behaviour
	// (and its tests) is preserved; the shipped default config opts into `udm`.
	if (config.source === 'udm') {
		return getUdmData(config, conn ?? EMPTY_CONNECTION, units);
	}
	return getLocalData(units);
}
