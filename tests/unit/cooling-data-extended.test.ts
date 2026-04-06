import { describe, it, expect } from 'vitest';
import { getData, onAction } from '$lib/modules/cooling/data.server';

describe('cooling getData extended', () => {
	it('returns exactly 4 relay states', async () => {
		const data = await getData({});
		expect((data.relays as boolean[]).length).toBe(4);
	});

	it('relay states are all booleans', async () => {
		const data = await getData({});
		for (const state of data.relays as boolean[]) {
			expect(typeof state).toBe('boolean');
		}
	});

	it('on is false when GPIO is unavailable', async () => {
		const data = await getData({});
		expect(data.on).toBe(false);
	});

	it('all relays are false when GPIO is unavailable', async () => {
		const data = await getData({});
		for (const state of data.relays as boolean[]) {
			expect(state).toBe(false);
		}
	});

	it('ignores config parameter', async () => {
		const data1 = await getData({});
		const data2 = await getData({ someKey: 'someValue' });
		expect(data1.gpioAvailable).toBe(data2.gpioAvailable);
		expect(data1.on).toBe(data2.on);
	});

	it('returns consistent shape across multiple calls', async () => {
		for (let i = 0; i < 3; i++) {
			const data = await getData({});
			expect(data).toHaveProperty('on');
			expect(data).toHaveProperty('relays');
			expect(data).toHaveProperty('gpioAvailable');
		}
	});
});

describe('cooling onAction extended', () => {
	it('toggle returns data with on and relays fields', async () => {
		const result = await onAction('toggle', undefined, {});
		expect(result.success).toBe(true);
		expect(result.data).toHaveProperty('on');
		expect(result.data).toHaveProperty('relays');
	});

	it('toggle with payload still works (payload ignored)', async () => {
		const result = await onAction('toggle', { extra: 'data' }, {});
		expect(result.success).toBe(true);
	});

	it('unknown action "restart" returns error', async () => {
		const result = await onAction('restart', undefined, {});
		expect(result.success).toBe(false);
		expect(result.error).toContain('restart');
	});

	it('unknown action "off" returns error', async () => {
		const result = await onAction('off', undefined, {});
		expect(result.success).toBe(false);
		expect(result.error).toContain('off');
	});

	it('empty action string returns error', async () => {
		const result = await onAction('', undefined, {});
		expect(result.success).toBe(false);
		expect(result.error).toContain('Unknown action');
	});

	it('error message includes the action name', async () => {
		const result = await onAction('foobar', undefined, {});
		expect(result.success).toBe(false);
		expect(result.error).toContain('foobar');
	});

	it('toggle result relays is an array of booleans', async () => {
		const result = await onAction('toggle', undefined, {});
		const relays = (result.data as { relays: boolean[] }).relays;
		expect(Array.isArray(relays)).toBe(true);
		for (const r of relays) {
			expect(typeof r).toBe('boolean');
		}
	});

	it('toggle result on is a boolean', async () => {
		const result = await onAction('toggle', undefined, {});
		const on = (result.data as { on: boolean }).on;
		expect(typeof on).toBe('boolean');
	});
});
