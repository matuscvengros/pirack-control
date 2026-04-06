import { describe, it, expect } from 'vitest';
import { appConfigSchema, actionRequestSchema } from '$lib/server/validation';

describe('appConfigSchema', () => {
	const validConfig = {
		general: {
			rackName: 'MY-RACK',
			rackSubtitle: '192.168.1.1',
			lcdAutoReturnSeconds: 60
		},
		modules: {
			order: ['rack-info', 'uptime'],
			enabled: ['rack-info'],
			settings: {
				temperature: { dangerThreshold: 45 }
			}
		}
	};

	it('accepts a valid config', () => {
		const result = appConfigSchema.safeParse(validConfig);
		expect(result.success).toBe(true);
	});

	it('accepts config with empty arrays', () => {
		const config = {
			...validConfig,
			modules: { order: [], enabled: [], settings: {} }
		};
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(true);
	});

	it('rejects missing general field', () => {
		const result = appConfigSchema.safeParse({ modules: validConfig.modules });
		expect(result.success).toBe(false);
	});

	it('rejects missing modules field', () => {
		const result = appConfigSchema.safeParse({ general: validConfig.general });
		expect(result.success).toBe(false);
	});

	it('rejects empty rackName', () => {
		const config = structuredClone(validConfig);
		config.general.rackName = '';
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	it('rejects rackName longer than 64 characters', () => {
		const config = structuredClone(validConfig);
		config.general.rackName = 'x'.repeat(65);
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	it('accepts rackName of exactly 64 characters', () => {
		const config = structuredClone(validConfig);
		config.general.rackName = 'x'.repeat(64);
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(true);
	});

	it('rejects rackSubtitle longer than 128 characters', () => {
		const config = structuredClone(validConfig);
		config.general.rackSubtitle = 'x'.repeat(129);
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	it('accepts empty rackSubtitle', () => {
		const config = structuredClone(validConfig);
		config.general.rackSubtitle = '';
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(true);
	});

	it('rejects lcdAutoReturnSeconds below 10', () => {
		const config = structuredClone(validConfig);
		config.general.lcdAutoReturnSeconds = 9;
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	it('rejects lcdAutoReturnSeconds above 300', () => {
		const config = structuredClone(validConfig);
		config.general.lcdAutoReturnSeconds = 301;
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	it('accepts lcdAutoReturnSeconds at boundaries (10 and 300)', () => {
		const config10 = structuredClone(validConfig);
		config10.general.lcdAutoReturnSeconds = 10;
		expect(appConfigSchema.safeParse(config10).success).toBe(true);

		const config300 = structuredClone(validConfig);
		config300.general.lcdAutoReturnSeconds = 300;
		expect(appConfigSchema.safeParse(config300).success).toBe(true);
	});

	it('rejects non-integer lcdAutoReturnSeconds', () => {
		const config = structuredClone(validConfig);
		config.general.lcdAutoReturnSeconds = 60.5;
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	it('rejects lcdAutoReturnSeconds as string', () => {
		const config = structuredClone(validConfig);
		(config.general as Record<string, unknown>).lcdAutoReturnSeconds = '60';
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	it('rejects rackName as number', () => {
		const config = structuredClone(validConfig);
		(config.general as Record<string, unknown>).rackName = 42;
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	it('rejects order with strings longer than 32 characters', () => {
		const config = structuredClone(validConfig);
		config.modules.order = ['x'.repeat(33)];
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	it('rejects order with more than 20 entries', () => {
		const config = structuredClone(validConfig);
		config.modules.order = Array.from({ length: 21 }, (_, i) => `mod-${i}`);
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(false);
	});

	it('accepts order with exactly 20 entries', () => {
		const config = structuredClone(validConfig);
		config.modules.order = Array.from({ length: 20 }, (_, i) => `mod-${i}`);
		const result = appConfigSchema.safeParse(config);
		expect(result.success).toBe(true);
	});

	it('rejects when general is null', () => {
		const result = appConfigSchema.safeParse({ general: null, modules: validConfig.modules });
		expect(result.success).toBe(false);
	});

	it('rejects completely empty object', () => {
		const result = appConfigSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects non-object input', () => {
		expect(appConfigSchema.safeParse('string').success).toBe(false);
		expect(appConfigSchema.safeParse(42).success).toBe(false);
		expect(appConfigSchema.safeParse(null).success).toBe(false);
		expect(appConfigSchema.safeParse(undefined).success).toBe(false);
	});
});

describe('actionRequestSchema', () => {
	it('accepts a valid action with no payload', () => {
		const result = actionRequestSchema.safeParse({ action: 'toggle' });
		expect(result.success).toBe(true);
	});

	it('accepts a valid action with payload', () => {
		const result = actionRequestSchema.safeParse({ action: 'toggle', payload: { relay: 0 } });
		expect(result.success).toBe(true);
	});

	it('rejects empty action string', () => {
		const result = actionRequestSchema.safeParse({ action: '' });
		expect(result.success).toBe(false);
	});

	it('rejects action longer than 32 characters', () => {
		const result = actionRequestSchema.safeParse({ action: 'x'.repeat(33) });
		expect(result.success).toBe(false);
	});

	it('accepts action of exactly 32 characters', () => {
		const result = actionRequestSchema.safeParse({ action: 'x'.repeat(32) });
		expect(result.success).toBe(true);
	});

	it('rejects missing action field', () => {
		const result = actionRequestSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects action as number', () => {
		const result = actionRequestSchema.safeParse({ action: 42 });
		expect(result.success).toBe(false);
	});

	it('rejects null input', () => {
		const result = actionRequestSchema.safeParse(null);
		expect(result.success).toBe(false);
	});

	it('accepts payload of any type', () => {
		expect(actionRequestSchema.safeParse({ action: 'a', payload: 'string' }).success).toBe(true);
		expect(actionRequestSchema.safeParse({ action: 'a', payload: 42 }).success).toBe(true);
		expect(actionRequestSchema.safeParse({ action: 'a', payload: [1, 2] }).success).toBe(true);
		expect(actionRequestSchema.safeParse({ action: 'a', payload: null }).success).toBe(true);
	});
});
