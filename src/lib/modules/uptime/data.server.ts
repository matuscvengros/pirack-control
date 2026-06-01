import type { ModuleConfig, ModuleData, UdmConnection } from '$lib/modules/types';
import { fetchGatewayUptime } from '$lib/server/udm';

// The gateway's uptime moves slowly, so we poll the console on a fixed, low-rate
// timer (independent of the dashboard's refresh) and serve the cached value. This
// keeps gateway traffic to one request per minute regardless of how many clients
// are watching.
const POLL_INTERVAL_MS = 60_000;

interface UptimeState {
	key: string;
	timer: ReturnType<typeof setInterval> | null;
	uptimeSeconds: number | null;
	lastError: string | null;
	lastOk: number | null;
}

let state: UptimeState | null = null;

function connKey(c: UdmConnection): string {
	return [c.host, c.site, c.insecureTLS, c.apiKey ? 'k' : '-'].join('|');
}

async function pollOnce(c: UdmConnection): Promise<void> {
	if (!state) return;
	try {
		const { uptimeSeconds } = await fetchGatewayUptime({
			host: c.host,
			apiKey: c.apiKey,
			site: c.site,
			insecureTLS: c.insecureTLS
		});
		state.uptimeSeconds = uptimeSeconds;
		state.lastError = null;
		state.lastOk = Date.now();
	} catch (e) {
		state.lastError = (e as Error).message;
	}
}

function ensurePoller(c: UdmConnection): void {
	const key = connKey(c);
	if (state && state.key === key) return;

	// Connection changed (or first run) — (re)start the poller.
	if (state?.timer) clearInterval(state.timer);
	state = { key, timer: null, uptimeSeconds: null, lastError: null, lastOk: null };

	void pollOnce(c);
	state.timer = setInterval(() => void pollOnce(c), POLL_INTERVAL_MS);
	// Don't keep the process (or test runner) alive just for polling.
	state.timer.unref?.();
}

export function decompose(totalSeconds: number): { days: number; hours: number; minutes: number } {
	return {
		days: Math.floor(totalSeconds / 86400),
		hours: Math.floor((totalSeconds % 86400) / 3600),
		minutes: Math.floor((totalSeconds % 3600) / 60)
	};
}

function downData(configured: boolean, error: string | null): ModuleData {
	return {
		source: 'udm',
		configured,
		down: true,
		error,
		totalSeconds: 0,
		days: 0,
		hours: 0,
		minutes: 0
	};
}

export async function getData(_config: ModuleConfig, udm?: UdmConnection): Promise<ModuleData> {
	if (!udm || !udm.host || !udm.apiKey) {
		return downData(false, !udm?.host ? 'Gateway host not set' : 'API key not set');
	}

	ensurePoller(udm);

	// "Down" reflects current reachability: no successful poll yet, or the most
	// recent poll failed (the gateway isn't answering right now).
	const connected = state != null && state.lastError == null && state.uptimeSeconds != null;
	if (!connected) {
		return downData(true, state?.lastError ?? null);
	}

	const totalSeconds = state!.uptimeSeconds!;
	return {
		source: 'udm',
		configured: true,
		down: false,
		error: null,
		totalSeconds,
		...decompose(totalSeconds)
	};
}
