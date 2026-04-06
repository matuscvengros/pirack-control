import { describe, it, expect } from 'vitest';
import { getData, onAction } from '$lib/modules/cooling/data.server';

describe('cooling data provider', () => {
	it('returns expected fields', async () => {
		const data = await getData({});
		expect(data).toHaveProperty('on');
		expect(data).toHaveProperty('relays');
		expect(data).toHaveProperty('gpioAvailable');
		expect(typeof data.on).toBe('boolean');
		expect(Array.isArray(data.relays)).toBe(true);
		expect((data.relays as boolean[]).length).toBe(4);
	});

	it('reports gpio as unavailable in test environment', async () => {
		const data = await getData({});
		expect(data.gpioAvailable).toBe(false);
	});

	it('toggle action returns success even without GPIO', async () => {
		const result = await onAction('toggle', undefined, {});
		expect(result.success).toBe(true);
		expect(result.data).toHaveProperty('on');
		expect(result.data).toHaveProperty('relays');
	});

	it('unknown action returns error', async () => {
		const result = await onAction('restart', undefined, {});
		expect(result.success).toBe(false);
		expect(result.error).toContain('Unknown action');
	});
});
