import fs from 'fs/promises';
import { mkdirSync, readFileSync } from 'fs';
import path from 'path';
import type { ModuleConfig, ModuleData } from '$lib/modules/types';

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

async function loadHistory(): Promise<TemperatureHistory> {
	try {
		const raw = await fs.readFile(getHistoryPath(), 'utf-8');
		return JSON.parse(raw);
	} catch {
		return { readings: [] };
	}
}

async function saveHistory(history: TemperatureHistory): Promise<void> {
	const dir = path.dirname(getHistoryPath());
	mkdirSync(dir, { recursive: true });
	await fs.writeFile(getHistoryPath(), JSON.stringify(history));
}

function readSystemTemp(): number | null {
	try {
		const raw = readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf-8');
		return parseInt(raw.trim(), 10) / 1000;
	} catch {
		return null;
	}
}

function pruneOldReadings(readings: TemperatureReading[]): TemperatureReading[] {
	const cutoff = Date.now() - 24 * 60 * 60 * 1000;
	return readings.filter((r) => r.timestamp > cutoff);
}

export async function getData(config: ModuleConfig): Promise<ModuleData> {
	const currentTemp = readSystemTemp();
	const history = await loadHistory();

	const now = Date.now();
	let dirty = false;

	if (currentTemp !== null) {
		const lastReading = history.readings[history.readings.length - 1];
		if (!lastReading || now - lastReading.timestamp >= 60000) {
			history.readings.push({ timestamp: now, value: currentTemp });
			dirty = true;
		}
	}

	// Always prune stale readings (even when no sensor) so the file doesn't grow unbounded
	const prunedReadings = pruneOldReadings(history.readings);
	if (prunedReadings.length !== history.readings.length) {
		dirty = true;
	}
	history.readings = prunedReadings;

	if (dirty) {
		await saveHistory(history);
	}

	const readings = prunedReadings;
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
