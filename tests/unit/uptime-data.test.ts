import { describe, it, expect } from 'vitest';
import { getData } from '$lib/modules/uptime/data.server';

describe('uptime data provider', () => {
	it('returns totalSeconds, days, hours, and minutes', async () => {
		const data = await getData({});
		expect(data).toHaveProperty('totalSeconds');
		expect(data).toHaveProperty('days');
		expect(data).toHaveProperty('hours');
		expect(data).toHaveProperty('minutes');
	});

	it('returns non-negative values', async () => {
		const data = await getData({});
		expect(data.totalSeconds as number).toBeGreaterThanOrEqual(0);
		expect(data.days as number).toBeGreaterThanOrEqual(0);
		expect(data.hours as number).toBeGreaterThanOrEqual(0);
		expect(data.minutes as number).toBeGreaterThanOrEqual(0);
	});

	it('has hours less than 24 and minutes less than 60', async () => {
		const data = await getData({});
		expect(data.hours as number).toBeLessThan(24);
		expect(data.minutes as number).toBeLessThan(60);
	});

	it('days/hours/minutes decomposition is consistent with totalSeconds', async () => {
		const data = await getData({});
		const recomposed =
			(data.days as number) * 86400 +
			(data.hours as number) * 3600 +
			(data.minutes as number) * 60;
		// The recomposed value should be within 60 seconds of totalSeconds
		// (because we lose the sub-minute remainder)
		const total = data.totalSeconds as number;
		expect(recomposed).toBeLessThanOrEqual(total);
		expect(total - recomposed).toBeLessThan(60);
	});
});
