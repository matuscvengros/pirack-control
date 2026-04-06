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
const MAX_HISTORY = 60;

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
	history.push({ timestamp: now, rxRate, txRate });
	if (history.length > MAX_HISTORY) history.shift();

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
