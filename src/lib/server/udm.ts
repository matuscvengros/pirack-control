import https from 'node:https';

/**
 * Client for reading whole-house WAN throughput from a UniFi OS console
 * (UDM Pro / UDR / UXG) using the local Network API.
 *
 * On UniFi OS the Network controller is proxied under `/proxy/network/...`.
 * Auth is a local API key (Settings → Control Plane → Integrations → API Keys)
 * sent as the `X-API-Key` header. The console uses a self-signed TLS cert, so
 * by default we do not verify it (`insecureTLS`).
 *
 * WAN rates are read from `stat/health` (subsystem `wan`), falling back to the
 * gateway entry in `stat/device`. The `*_bytes-r` fields are already-computed
 * byte-per-second rates, so no delta maths is needed.
 */

export interface WanRates {
	/** Download — bytes/sec the gateway receives from the internet. */
	rxRate: number;
	/** Upload — bytes/sec the gateway sends to the internet. */
	txRate: number;
	wanIp?: string;
	/** Gateway-reported WAN latency in ms, if available. */
	latency?: number;
	/** ISP name, if reported. */
	isp?: string;
	/** Whether the WAN link reports itself as up/ok. */
	up?: boolean;
}

export interface UdmOptions {
	/** IP or hostname of the console, no scheme (e.g. `192.168.1.1`). */
	host: string;
	apiKey: string;
	/** UniFi site name, usually `default`. */
	site?: string;
	/** Skip TLS verification for the console's self-signed cert. Default true. */
	insecureTLS?: boolean;
	timeoutMs?: number;
}

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null;
}

function num(v: unknown): number | undefined {
	return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function httpsGetJson(
	url: string,
	headers: Record<string, string>,
	insecure: boolean,
	timeoutMs: number
): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const req = https.request(
			url,
			{ method: 'GET', headers, rejectUnauthorized: !insecure, timeout: timeoutMs },
			(res) => {
				let body = '';
				res.setEncoding('utf-8');
				res.on('data', (chunk) => (body += chunk));
				res.on('end', () => {
					const status = res.statusCode ?? 0;
					if (status < 200 || status >= 300) {
						reject(new Error(`HTTP ${status} from ${url}`));
						return;
					}
					try {
						resolve(JSON.parse(body));
					} catch {
						reject(new Error(`Invalid JSON from ${url}`));
					}
				});
			}
		);
		req.on('error', (err) => reject(err));
		req.on('timeout', () => req.destroy(new Error(`Timed out after ${timeoutMs}ms`)));
		req.end();
	});
}

function hasRates(s: Record<string, unknown> | undefined): boolean {
	return !!s && (num(s['rx_bytes-r']) !== undefined || num(s['tx_bytes-r']) !== undefined);
}

/**
 * Extract WAN rates from a `stat/health` response. Returns null if absent.
 *
 * Throughput and the WAN IP/ISP live on the `wan` subsystem, while latency
 * lives on the `www` (internet) subsystem — so we read across both.
 */
export function extractWanRatesFromHealth(payload: unknown): WanRates | null {
	if (!isRecord(payload) || !Array.isArray(payload.data)) return null;
	const subsystems = payload.data.filter(isRecord);
	const wan = subsystems.find((s) => s.subsystem === 'wan');
	const www = subsystems.find((s) => s.subsystem === 'www');

	const rateSrc = hasRates(wan) ? wan : hasRates(www) ? www : null;
	if (!rateSrc) return null;

	const primary = wan ?? www ?? rateSrc;
	const status = wan?.status ?? www?.status;

	return {
		rxRate: num(rateSrc['rx_bytes-r']) ?? 0,
		txRate: num(rateSrc['tx_bytes-r']) ?? 0,
		wanIp: typeof primary.wan_ip === 'string' ? primary.wan_ip : undefined,
		latency: num(www?.latency) ?? num(wan?.latency),
		isp: typeof wan?.isp_name === 'string' ? wan.isp_name : undefined,
		up: status === 'ok' || status === 'warning'
	};
}

/** Extract WAN rates from the gateway entry of a `stat/device` response. */
export function extractWanRatesFromDevices(payload: unknown): WanRates | null {
	if (!isRecord(payload) || !Array.isArray(payload.data)) return null;
	for (const device of payload.data) {
		if (!isRecord(device)) continue;
		// The gateway exposes WAN counters under `wan1` or `uplink`.
		const wan = [device.wan1, device.wan2, device.uplink].find(
			(w) => isRecord(w) && (num(w['rx_bytes-r']) !== undefined || num(w['tx_bytes-r']) !== undefined)
		);
		if (!isRecord(wan)) continue;
		return {
			rxRate: num(wan['rx_bytes-r']) ?? 0,
			txRate: num(wan['tx_bytes-r']) ?? 0,
			wanIp: typeof wan.ip === 'string' ? wan.ip : undefined,
			latency: num(wan.latency),
			up: wan.up === true || device.state === 1
		};
	}
	return null;
}

/**
 * Fetch the current WAN up/download rates from the console.
 * Throws if neither endpoint yields usable rates.
 */
export async function fetchWanRates(opts: UdmOptions): Promise<WanRates> {
	const site = opts.site || 'default';
	const insecure = opts.insecureTLS !== false;
	const timeoutMs = opts.timeoutMs ?? 4000;
	const base = `https://${opts.host}/proxy/network/api/s/${encodeURIComponent(site)}`;
	const headers = { 'X-API-Key': opts.apiKey, Accept: 'application/json' };

	let lastError: Error | null = null;

	try {
		const health = await httpsGetJson(`${base}/stat/health`, headers, insecure, timeoutMs);
		const rates = extractWanRatesFromHealth(health);
		if (rates) return rates;
	} catch (e) {
		lastError = e as Error;
	}

	try {
		const devices = await httpsGetJson(`${base}/stat/device`, headers, insecure, timeoutMs);
		const rates = extractWanRatesFromDevices(devices);
		if (rates) return rates;
	} catch (e) {
		lastError = e as Error;
	}

	throw lastError ?? new Error('Could not read WAN rates from console');
}
