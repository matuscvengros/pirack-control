import { describe, it, expect } from 'vitest';
import { formatRate, formatRateString } from '$lib/modules/network/format';

describe('formatRate (bits)', () => {
	it('formats Mbps from bytes/sec', () => {
		// 1,250,000 B/s * 8 = 10,000,000 bits/s = 10 Mbps
		expect(formatRate(1_250_000, 'bits')).toEqual({ value: '10.0', unit: 'Mbps' });
	});

	it('uses Gbps above 1e9 bits/s', () => {
		expect(formatRate(200_000_000, 'bits')).toEqual({ value: '1.60', unit: 'Gbps' });
	});

	it('uses Kbps and bps for small rates', () => {
		expect(formatRate(500, 'bits')).toEqual({ value: '4.0', unit: 'Kbps' });
		expect(formatRate(10, 'bits')).toEqual({ value: '80', unit: 'bps' });
	});
});

describe('formatRate (bytes)', () => {
	it('formats MB/s and KB/s', () => {
		expect(formatRate(2_000_000, 'bytes')).toEqual({ value: '2.0', unit: 'MB/s' });
		expect(formatRate(2_000, 'bytes')).toEqual({ value: '2.0', unit: 'KB/s' });
	});
});

describe('formatRate edge cases', () => {
	it('clamps negative and non-finite input to zero', () => {
		expect(formatRate(-5, 'bits')).toEqual({ value: '0', unit: 'bps' });
		expect(formatRate(NaN, 'bytes')).toEqual({ value: '0', unit: 'B/s' });
	});

	it('formatRateString joins value and unit', () => {
		expect(formatRateString(1_250_000, 'bits')).toBe('10.0 Mbps');
	});
});
