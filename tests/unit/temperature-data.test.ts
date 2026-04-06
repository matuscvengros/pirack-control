import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getData } from '$lib/modules/temperature/data.server';

const TEST_DATA_DIR = path.join(process.cwd(), 'tests', '.test-data-temp');

describe('temperature data provider', () => {
	beforeEach(() => {
		fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
		process.env.DATA_DIR = TEST_DATA_DIR;
	});

	afterEach(() => {
		fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
		delete process.env.DATA_DIR;
	});

	it('returns expected fields with no history file', async () => {
		const data = await getData({ dangerThreshold: 50 });
		expect(data).toHaveProperty('current');
		expect(data).toHaveProperty('high');
		expect(data).toHaveProperty('low');
		expect(data).toHaveProperty('avg');
		expect(data).toHaveProperty('dangerThreshold');
		expect(data).toHaveProperty('history');
		expect(data.dangerThreshold).toBe(50);
	});

	it('uses default dangerThreshold when not provided', async () => {
		const data = await getData({});
		expect(data.dangerThreshold).toBe(45);
	});

	it('returns null stats when history is empty and no sensor', async () => {
		const data = await getData({});
		// On a dev machine without /sys/class/thermal/thermal_zone0/temp,
		// current will be null
		expect(data.high).toBeNull();
		expect(data.low).toBeNull();
		expect(data.avg).toBeNull();
		expect(Array.isArray(data.history)).toBe(true);
	});

	it('loads existing history and computes stats', async () => {
		const now = Date.now();
		const historyData = {
			readings: [
				{ timestamp: now - 3600000, value: 40.5 },
				{ timestamp: now - 1800000, value: 42.0 },
				{ timestamp: now - 600000, value: 38.2 }
			]
		};
		const historyPath = path.join(TEST_DATA_DIR, 'temperature-history.json');
		fs.writeFileSync(historyPath, JSON.stringify(historyData));

		const data = await getData({ dangerThreshold: 45 });
		expect(data.high).toBe(42.0);
		expect(data.low).toBe(38.2);
		expect(data.avg).toBe(40.2); // (40.5 + 42.0 + 38.2) / 3 = 40.233... rounds to 40.2
		expect((data.history as unknown[]).length).toBe(3);
	});

	it('prunes readings older than 24 hours', async () => {
		const now = Date.now();
		const historyData = {
			readings: [
				{ timestamp: now - 25 * 60 * 60 * 1000, value: 35.0 }, // 25h ago - should be pruned
				{ timestamp: now - 23 * 60 * 60 * 1000, value: 40.0 }, // 23h ago - should remain
				{ timestamp: now - 1 * 60 * 60 * 1000, value: 42.0 }  // 1h ago - should remain
			]
		};
		const historyPath = path.join(TEST_DATA_DIR, 'temperature-history.json');
		fs.writeFileSync(historyPath, JSON.stringify(historyData));

		const data = await getData({ dangerThreshold: 45 });
		expect((data.history as unknown[]).length).toBe(2);
		expect(data.low).toBe(40.0);
		expect(data.high).toBe(42.0);
	});

	it('saves pruned history back to disk', async () => {
		const now = Date.now();
		const historyData = {
			readings: [
				{ timestamp: now - 25 * 60 * 60 * 1000, value: 35.0 }, // stale
				{ timestamp: now - 1 * 60 * 60 * 1000, value: 42.0 }
			]
		};
		const historyPath = path.join(TEST_DATA_DIR, 'temperature-history.json');
		fs.writeFileSync(historyPath, JSON.stringify(historyData));

		await getData({ dangerThreshold: 45 });

		const saved = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
		expect(saved.readings.length).toBe(1);
		expect(saved.readings[0].value).toBe(42.0);
	});

	it('history values are rounded to one decimal place', async () => {
		const now = Date.now();
		const historyData = {
			readings: [
				{ timestamp: now - 3600000, value: 40.567 },
				{ timestamp: now - 1800000, value: 41.234 }
			]
		};
		const historyPath = path.join(TEST_DATA_DIR, 'temperature-history.json');
		fs.writeFileSync(historyPath, JSON.stringify(historyData));

		const data = await getData({});
		const history = data.history as { value: number }[];
		expect(history[0].value).toBe(40.6);
		expect(history[1].value).toBe(41.2);
	});
});
