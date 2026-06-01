import { describe, it, expect } from 'vitest';
import { getData, decompose } from '$lib/modules/uptime/data.server';

describe('uptime data extended (gateway-backed)', () => {
	it('no longer exposes a seconds field (minute granularity)', async () => {
		const data = await getData({});
		expect(data).not.toHaveProperty('seconds');
	});

	it('day/hour/minute fields are integers', async () => {
		const data = await getData({});
		expect(Number.isInteger(data.days)).toBe(true);
		expect(Number.isInteger(data.hours)).toBe(true);
		expect(Number.isInteger(data.minutes)).toBe(true);
	});

	it('returns a consistent down shape across multiple calls', async () => {
		for (let i = 0; i < 3; i++) {
			const data = await getData({});
			expect(data.down).toBe(true);
			expect(data).toHaveProperty('totalSeconds');
			expect(data).toHaveProperty('days');
			expect(data).toHaveProperty('hours');
			expect(data).toHaveProperty('minutes');
		}
	});
});

describe('decompose', () => {
	it('splits seconds into days / hours / minutes (dropping sub-minute remainder)', () => {
		// 1 day + 1 hour + 1 minute + 1 second
		expect(decompose(90061)).toEqual({ days: 1, hours: 1, minutes: 1 });
	});

	it('handles zero', () => {
		expect(decompose(0)).toEqual({ days: 0, hours: 0, minutes: 0 });
	});

	it('handles just-under-a-day', () => {
		expect(decompose(86399)).toEqual({ days: 0, hours: 23, minutes: 59 });
	});

	it('handles multi-day uptimes', () => {
		expect(decompose(10 * 86400 + 5 * 3600 + 30 * 60)).toEqual({ days: 10, hours: 5, minutes: 30 });
	});
});
