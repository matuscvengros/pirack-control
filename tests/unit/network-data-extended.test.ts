import { describe, it, expect } from 'vitest';
import { getData } from '$lib/modules/network/data.server';

describe('network data extended', () => {
	it('history entries have timestamp, rxRate, txRate', async () => {
		await getData({});
		const data = await getData({});
		const history = data.history as { timestamp: number; rxRate: number; txRate: number }[];
		for (const entry of history) {
			expect(typeof entry.timestamp).toBe('number');
			expect(typeof entry.rxRate).toBe('number');
			expect(typeof entry.txRate).toBe('number');
		}
	});

	it('rates are integers (rounded)', async () => {
		const data = await getData({});
		expect(Number.isInteger(data.rxRate)).toBe(true);
		expect(Number.isInteger(data.txRate)).toBe(true);
	});

	it('history rates are integers (rounded)', async () => {
		await getData({});
		const data = await getData({});
		const history = data.history as { rxRate: number; txRate: number }[];
		for (const entry of history) {
			expect(Number.isInteger(entry.rxRate)).toBe(true);
			expect(Number.isInteger(entry.txRate)).toBe(true);
		}
	});

	it('primaryIp is a non-empty string', async () => {
		const data = await getData({});
		expect(typeof data.primaryIp).toBe('string');
		expect((data.primaryIp as string).length).toBeGreaterThan(0);
	});

	it('history does not exceed MAX_HISTORY (60) entries', async () => {
		// Call getData many times to accumulate history
		for (let i = 0; i < 65; i++) {
			await getData({});
		}
		const data = await getData({});
		const history = data.history as unknown[];
		expect(history.length).toBeLessThanOrEqual(60);
	});

	it('history timestamps are monotonically increasing', async () => {
		// Make a few calls
		for (let i = 0; i < 5; i++) {
			await getData({});
		}
		const data = await getData({});
		const history = data.history as { timestamp: number }[];
		for (let i = 1; i < history.length; i++) {
			expect(history[i].timestamp).toBeGreaterThanOrEqual(history[i - 1].timestamp);
		}
	});

	it('ignores config parameter', async () => {
		const data1 = await getData({});
		const data2 = await getData({ someKey: 'value' });
		// Both should return the same shape
		expect(typeof data1.rxRate).toBe('number');
		expect(typeof data2.rxRate).toBe('number');
	});

	it('consecutive calls produce non-negative rate values', async () => {
		await getData({}); // baseline
		const data = await getData({});
		expect(data.rxRate as number).toBeGreaterThanOrEqual(0);
		expect(data.txRate as number).toBeGreaterThanOrEqual(0);
	});
});
