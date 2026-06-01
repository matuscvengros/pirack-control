import { describe, it, expect } from 'vitest';
import { getData } from '$lib/modules/network/data.server';

describe('network module — UDM mode (unconfigured)', () => {
	it('reports not-configured without a host', async () => {
		const data = await getData({ source: 'udm' });
		expect(data.source).toBe('udm');
		expect(data.configured).toBe(false);
		expect(data.connected).toBe(false);
		expect(data.rxRate).toBe(0);
		expect(data.txRate).toBe(0);
		expect(Array.isArray(data.history)).toBe(true);
	});

	it('reports not-configured with a host but no API key', async () => {
		const data = await getData(
			{ source: 'udm' },
			{ host: '192.168.1.1', apiKey: '', site: 'default', insecureTLS: true }
		);
		expect(data.configured).toBe(false);
		expect(data.error).toMatch(/api key/i);
	});

	it('defaults units to bits in UDM mode', async () => {
		const data = await getData({ source: 'udm' });
		expect(data.units).toBe('bits');
	});

	it('honours an explicit bytes unit', async () => {
		const data = await getData({ source: 'udm', units: 'bytes' });
		expect(data.units).toBe('bytes');
	});

	it('still falls back to local mode for unknown sources', async () => {
		const data = await getData({ source: 'something-else' });
		expect(data.source).toBe('local');
		expect(data).toHaveProperty('primaryIp');
	});
});
