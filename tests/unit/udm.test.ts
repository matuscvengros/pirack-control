import { describe, it, expect } from 'vitest';
import { extractWanRatesFromHealth, extractWanRatesFromDevices } from '$lib/server/udm';

describe('extractWanRatesFromHealth', () => {
	it('reads rx/tx rates from the wan subsystem', () => {
		const payload = {
			data: [
				{ subsystem: 'lan', 'rx_bytes-r': 1, 'tx_bytes-r': 2 },
				{
					subsystem: 'wan',
					'rx_bytes-r': 1_250_000,
					'tx_bytes-r': 250_000,
					wan_ip: '203.0.113.7',
					latency: 12,
					status: 'ok'
				}
			]
		};
		const rates = extractWanRatesFromHealth(payload);
		expect(rates).toEqual({
			rxRate: 1_250_000,
			txRate: 250_000,
			wanIp: '203.0.113.7',
			latency: 12,
			up: true
		});
	});

	it('falls back to the www subsystem when wan is absent', () => {
		const payload = { data: [{ subsystem: 'www', 'rx_bytes-r': 100, 'tx_bytes-r': 50 }] };
		const rates = extractWanRatesFromHealth(payload);
		expect(rates?.rxRate).toBe(100);
		expect(rates?.txRate).toBe(50);
	});

	it('returns null when no rate fields are present', () => {
		const payload = { data: [{ subsystem: 'wan', status: 'ok' }] };
		expect(extractWanRatesFromHealth(payload)).toBeNull();
	});

	it('returns null on malformed payloads', () => {
		expect(extractWanRatesFromHealth(null)).toBeNull();
		expect(extractWanRatesFromHealth({})).toBeNull();
		expect(extractWanRatesFromHealth({ data: 'nope' })).toBeNull();
	});

	it('defaults a missing direction to 0', () => {
		const payload = { data: [{ subsystem: 'wan', 'rx_bytes-r': 500 }] };
		const rates = extractWanRatesFromHealth(payload);
		expect(rates?.rxRate).toBe(500);
		expect(rates?.txRate).toBe(0);
	});

	it('merges rates/ISP from wan with latency from www (real UDM Pro shape)', () => {
		const payload = {
			data: [
				{ subsystem: 'wlan' },
				{
					subsystem: 'wan',
					'rx_bytes-r': 729,
					'tx_bytes-r': 628,
					wan_ip: '203.0.113.95',
					isp_name: 'Example ISP',
					status: 'ok'
				},
				{ subsystem: 'www', 'rx_bytes-r': 729, 'tx_bytes-r': 628, latency: 5, status: 'ok' },
				{ subsystem: 'lan' }
			]
		};
		const rates = extractWanRatesFromHealth(payload);
		expect(rates).toEqual({
			rxRate: 729,
			txRate: 628,
			wanIp: '203.0.113.95',
			latency: 5,
			isp: 'Example ISP',
			up: true
		});
	});
});

describe('extractWanRatesFromDevices', () => {
	it('reads rates from the gateway wan1 entry', () => {
		const payload = {
			data: [
				{ type: 'usw', mac: 'aa' },
				{
					type: 'udm',
					wan1: { 'rx_bytes-r': 900_000, 'tx_bytes-r': 120_000, ip: '203.0.113.7', up: true }
				}
			]
		};
		const rates = extractWanRatesFromDevices(payload);
		expect(rates).toMatchObject({ rxRate: 900_000, txRate: 120_000, wanIp: '203.0.113.7', up: true });
	});

	it('reads rates from the uplink entry when wan1 is absent', () => {
		const payload = {
			data: [{ type: 'ugw', uplink: { 'rx_bytes-r': 10, 'tx_bytes-r': 20 } }]
		};
		const rates = extractWanRatesFromDevices(payload);
		expect(rates?.rxRate).toBe(10);
		expect(rates?.txRate).toBe(20);
	});

	it('returns null when no gateway exposes wan rates', () => {
		const payload = { data: [{ type: 'usw', mac: 'aa' }] };
		expect(extractWanRatesFromDevices(payload)).toBeNull();
	});
});
