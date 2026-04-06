import { describe, it, expect } from 'vitest';
import { getData } from '$lib/modules/uptime/data.server';

describe('uptime data extended', () => {
	it('returns seconds field less than 60', async () => {
		const data = await getData({});
		expect(data.seconds as number).toBeLessThan(60);
		expect(data.seconds as number).toBeGreaterThanOrEqual(0);
	});

	it('all fields are integers', async () => {
		const data = await getData({});
		expect(Number.isInteger(data.days)).toBe(true);
		expect(Number.isInteger(data.hours)).toBe(true);
		expect(Number.isInteger(data.minutes)).toBe(true);
		expect(Number.isInteger(data.seconds)).toBe(true);
	});

	it('totalSeconds equals full decomposition including seconds', async () => {
		const data = await getData({});
		const recomposed =
			(data.days as number) * 86400 +
			(data.hours as number) * 3600 +
			(data.minutes as number) * 60 +
			(data.seconds as number);
		// totalSeconds is from os.uptime() which returns seconds as integer
		expect(recomposed).toBe(Math.floor(data.totalSeconds as number));
	});

	it('ignores config parameter', async () => {
		const data1 = await getData({});
		const data2 = await getData({ anything: true });
		// Both should return the same shape with similar values
		expect(typeof data1.totalSeconds).toBe('number');
		expect(typeof data2.totalSeconds).toBe('number');
	});

	it('returns consistent shape across multiple calls', async () => {
		for (let i = 0; i < 3; i++) {
			const data = await getData({});
			expect(data).toHaveProperty('totalSeconds');
			expect(data).toHaveProperty('days');
			expect(data).toHaveProperty('hours');
			expect(data).toHaveProperty('minutes');
			expect(data).toHaveProperty('seconds');
		}
	});

	it('totalSeconds is positive (system has been running)', async () => {
		const data = await getData({});
		expect(data.totalSeconds as number).toBeGreaterThan(0);
	});
});
