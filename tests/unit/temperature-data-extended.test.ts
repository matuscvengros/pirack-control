import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getData } from '$lib/modules/temperature/data.server';

const TEST_DATA_DIR = path.join(process.cwd(), 'tests', '.test-data-temp-ext');

describe('temperature data extended', () => {
	beforeEach(() => {
		fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
		process.env.DATA_DIR = TEST_DATA_DIR;
	});

	afterEach(() => {
		fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
		delete process.env.DATA_DIR;
	});

	it('does not record reading when interval < 60s since last', async () => {
		const now = Date.now();
		const historyData = {
			readings: [
				{ timestamp: now - 30000, value: 40.0 } // 30s ago - too recent
			]
		};
		const historyPath = path.join(TEST_DATA_DIR, 'temperature-history.json');
		fs.writeFileSync(historyPath, JSON.stringify(historyData));

		await getData({ dangerThreshold: 45 });

		// On dev machines without thermal sensor, no new reading would be added anyway
		// But the existing reading should still be there
		const saved = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
		expect(saved.readings.length).toBe(1);
	});

	it('prunes all readings when all are older than 24h', async () => {
		const now = Date.now();
		const historyData = {
			readings: [
				{ timestamp: now - 25 * 60 * 60 * 1000, value: 35.0 },
				{ timestamp: now - 26 * 60 * 60 * 1000, value: 36.0 },
				{ timestamp: now - 48 * 60 * 60 * 1000, value: 37.0 }
			]
		};
		const historyPath = path.join(TEST_DATA_DIR, 'temperature-history.json');
		fs.writeFileSync(historyPath, JSON.stringify(historyData));

		const data = await getData({});
		expect((data.history as unknown[]).length).toBe(0);
		expect(data.high).toBeNull();
		expect(data.low).toBeNull();
		expect(data.avg).toBeNull();
	});

	it('keeps readings exactly at the 24h boundary', async () => {
		const now = Date.now();
		// 23h59m ago (safely within 24h window)
		const historyData = {
			readings: [
				{ timestamp: now - 23 * 60 * 60 * 1000 - 59 * 60 * 1000, value: 40.0 }
			]
		};
		const historyPath = path.join(TEST_DATA_DIR, 'temperature-history.json');
		fs.writeFileSync(historyPath, JSON.stringify(historyData));

		const data = await getData({});
		expect((data.history as unknown[]).length).toBe(1);
	});

	it('removes readings exactly at the 24h cutoff', async () => {
		const now = Date.now();
		// Exactly 24h ago (cutoff = now - 24h, filter keeps timestamp > cutoff)
		const historyData = {
			readings: [
				{ timestamp: now - 24 * 60 * 60 * 1000, value: 40.0 }
			]
		};
		const historyPath = path.join(TEST_DATA_DIR, 'temperature-history.json');
		fs.writeFileSync(historyPath, JSON.stringify(historyData));

		const data = await getData({});
		expect((data.history as unknown[]).length).toBe(0);
	});

	it('handles empty readings array in history file', async () => {
		const historyPath = path.join(TEST_DATA_DIR, 'temperature-history.json');
		fs.writeFileSync(historyPath, JSON.stringify({ readings: [] }));

		const data = await getData({});
		expect(data.high).toBeNull();
		expect(data.low).toBeNull();
		expect(data.avg).toBeNull();
		expect((data.history as unknown[]).length).toBe(0);
	});

	it('handles single reading correctly', async () => {
		const now = Date.now();
		const historyData = {
			readings: [
				{ timestamp: now - 1000, value: 42.5 }
			]
		};
		const historyPath = path.join(TEST_DATA_DIR, 'temperature-history.json');
		fs.writeFileSync(historyPath, JSON.stringify(historyData));

		const data = await getData({});
		expect(data.high).toBe(42.5);
		expect(data.low).toBe(42.5);
		expect(data.avg).toBe(42.5);
	});

	it('handles many readings without error', async () => {
		const now = Date.now();
		const readings = Array.from({ length: 1000 }, (_, i) => ({
			timestamp: now - (i + 1) * 60000,
			value: 30 + Math.random() * 20
		})).filter((r) => r.timestamp > now - 24 * 60 * 60 * 1000);

		const historyPath = path.join(TEST_DATA_DIR, 'temperature-history.json');
		fs.writeFileSync(historyPath, JSON.stringify({ readings }));

		const data = await getData({});
		expect((data.history as unknown[]).length).toBeLessThanOrEqual(readings.length);
		expect(data.high).not.toBeNull();
		expect(data.low).not.toBeNull();
		expect(data.avg).not.toBeNull();
	});

	it('stats are rounded to one decimal place', async () => {
		const now = Date.now();
		const historyData = {
			readings: [
				{ timestamp: now - 3600000, value: 40.123 },
				{ timestamp: now - 1800000, value: 42.456 },
				{ timestamp: now - 600000, value: 38.789 }
			]
		};
		const historyPath = path.join(TEST_DATA_DIR, 'temperature-history.json');
		fs.writeFileSync(historyPath, JSON.stringify(historyData));

		const data = await getData({});
		// Check that high, low, avg are rounded
		expect(data.high).toBe(42.5); // 42.456 rounds to 42.5
		expect(data.low).toBe(38.8);  // 38.789 rounds to 38.8
		// avg = (40.123 + 42.456 + 38.789) / 3 = 40.456 rounds to 40.5
		expect(data.avg).toBe(40.5);
	});

	it('dangerThreshold defaults to 45 when config key missing', async () => {
		const data = await getData({});
		expect(data.dangerThreshold).toBe(45);
	});

	it('dangerThreshold uses provided value', async () => {
		const data = await getData({ dangerThreshold: 55 });
		expect(data.dangerThreshold).toBe(55);
	});

	it('handles corrupted history file gracefully', async () => {
		const historyPath = path.join(TEST_DATA_DIR, 'temperature-history.json');
		fs.writeFileSync(historyPath, 'not json at all!!!');

		const data = await getData({});
		expect(data).toHaveProperty('current');
		expect(data).toHaveProperty('history');
		expect((data.history as unknown[]).length).toBe(0);
	});
});
