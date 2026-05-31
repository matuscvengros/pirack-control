export type RateUnits = 'bits' | 'bytes';

/**
 * Format a byte-per-second rate into a human value + unit.
 *
 * - `bits`  → bps / Kbps / Mbps / Gbps (base-10, the convention ISPs use for
 *   internet bandwidth — 1 Mbps = 1,000,000 bits/s).
 * - `bytes` → B/s / KB/s / MB/s (base-10, matching the original module).
 */
export function formatRate(
	bytesPerSec: number,
	units: RateUnits = 'bytes'
): { value: string; unit: string } {
	const v = Number.isFinite(bytesPerSec) && bytesPerSec > 0 ? bytesPerSec : 0;

	if (units === 'bits') {
		const bits = v * 8;
		if (bits >= 1_000_000_000) return { value: (bits / 1_000_000_000).toFixed(2), unit: 'Gbps' };
		if (bits >= 1_000_000) return { value: (bits / 1_000_000).toFixed(1), unit: 'Mbps' };
		if (bits >= 1_000) return { value: (bits / 1_000).toFixed(1), unit: 'Kbps' };
		return { value: Math.round(bits).toString(), unit: 'bps' };
	}

	if (v >= 1_000_000) return { value: (v / 1_000_000).toFixed(1), unit: 'MB/s' };
	if (v >= 1_000) return { value: (v / 1_000).toFixed(1), unit: 'KB/s' };
	return { value: Math.round(v).toString(), unit: 'B/s' };
}

/** Convenience wrapper returning a single `"<value> <unit>"` string. */
export function formatRateString(bytesPerSec: number, units: RateUnits = 'bytes'): string {
	const r = formatRate(bytesPerSec, units);
	return `${r.value} ${r.unit}`;
}
