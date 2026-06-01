import { describe, it, expect } from 'vitest';
import { getData } from '$lib/modules/uptime/data.server';

// The uptime module now reports the gateway's uptime via a shared connection.
// Without a connection it short-circuits to a "down" state (no network calls),
// which is the path these unit tests exercise. The decomposition maths is covered
// separately via the exported `decompose` helper, and gateway parsing via udm.test.ts.

describe('uptime data provider (gateway-backed)', () => {
	it('reports down + not-configured when no connection is supplied', async () => {
		const data = await getData({});
		expect(data.source).toBe('udm');
		expect(data.configured).toBe(false);
		expect(data.down).toBe(true);
		expect(data.error).toMatch(/host/i);
	});

	it('reports down when a host is set but the API key is missing', async () => {
		const data = await getData(
			{},
			{ host: '192.168.1.1', apiKey: '', site: 'default', insecureTLS: true }
		);
		expect(data.configured).toBe(false);
		expect(data.down).toBe(true);
		expect(data.error).toMatch(/api key/i);
	});

	it('always exposes the day/hour/minute fields (zeroed when down)', async () => {
		const data = await getData({});
		expect(data).toHaveProperty('totalSeconds');
		expect(data).toHaveProperty('days');
		expect(data).toHaveProperty('hours');
		expect(data).toHaveProperty('minutes');
		expect(data.days).toBe(0);
		expect(data.hours).toBe(0);
		expect(data.minutes).toBe(0);
	});
});
