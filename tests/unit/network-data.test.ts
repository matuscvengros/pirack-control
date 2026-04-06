import { describe, it, expect } from 'vitest';
import { getData } from '$lib/modules/network/data.server';

describe('network data provider', () => {
	it('returns expected fields', async () => {
		const data = await getData({});
		expect(data).toHaveProperty('rxRate');
		expect(data).toHaveProperty('txRate');
		expect(data).toHaveProperty('primaryIp');
		expect(data).toHaveProperty('history');
	});

	it('returns non-negative rates', async () => {
		const data = await getData({});
		expect(data.rxRate as number).toBeGreaterThanOrEqual(0);
		expect(data.txRate as number).toBeGreaterThanOrEqual(0);
	});

	it('accumulates history entries across calls', async () => {
		// First call establishes baseline
		const data1 = await getData({});
		const history1 = data1.history as unknown[];

		// Second call should have one more entry
		const data2 = await getData({});
		const history2 = data2.history as unknown[];
		expect(history2.length).toBe(history1.length + 1);
	});

	it('primaryIp is a string', async () => {
		const data = await getData({});
		expect(typeof data.primaryIp).toBe('string');
	});

	it('history entries have rxRate and txRate', async () => {
		await getData({}); // ensure at least one entry
		const data = await getData({});
		const history = data.history as { rxRate: number; txRate: number }[];
		expect(history.length).toBeGreaterThan(0);
		for (const entry of history) {
			expect(typeof entry.rxRate).toBe('number');
			expect(typeof entry.txRate).toBe('number');
		}
	});
});
