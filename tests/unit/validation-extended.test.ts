import { describe, it, expect } from 'vitest';
import { appConfigSchema, actionRequestSchema } from '$lib/server/validation';

describe('appConfigSchema extended', () => {
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

	it('rejects when rackName is missing entirely', () => {
		const config = structuredClone(validConfig);
		delete (config.general as Record<string, unknown>).rackName;
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('rejects when rackSubtitle is missing entirely', () => {
		const config = structuredClone(validConfig);
		delete (config.general as Record<string, unknown>).rackSubtitle;
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('rejects when lcdAutoReturnSeconds is missing entirely', () => {
		const config = structuredClone(validConfig);
		delete (config.general as Record<string, unknown>).lcdAutoReturnSeconds;
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('rejects when order is missing', () => {
		const config = structuredClone(validConfig);
		delete (config.modules as Record<string, unknown>).order;
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('rejects when enabled is missing', () => {
		const config = structuredClone(validConfig);
		delete (config.modules as Record<string, unknown>).enabled;
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('rejects when settings is missing', () => {
		const config = structuredClone(validConfig);
		delete (config.modules as Record<string, unknown>).settings;
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('accepts lcdAutoReturnSeconds at exact boundary 10', () => {
		const config = structuredClone(validConfig);
		config.general.lcdAutoReturnSeconds = 10;
		expect(appConfigSchema.safeParse(config).success).toBe(true);
	});

	it('accepts lcdAutoReturnSeconds at exact boundary 300', () => {
		const config = structuredClone(validConfig);
		config.general.lcdAutoReturnSeconds = 300;
		expect(appConfigSchema.safeParse(config).success).toBe(true);
	});

	it('rejects lcdAutoReturnSeconds as negative number', () => {
		const config = structuredClone(validConfig);
		config.general.lcdAutoReturnSeconds = -1;
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('rejects lcdAutoReturnSeconds as zero', () => {
		const config = structuredClone(validConfig);
		config.general.lcdAutoReturnSeconds = 0;
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('rejects order as non-array', () => {
		const config = structuredClone(validConfig);
		(config.modules as Record<string, unknown>).order = 'rack-info';
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('rejects enabled as non-array', () => {
		const config = structuredClone(validConfig);
		(config.modules as Record<string, unknown>).enabled = 'rack-info';
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('rejects settings as non-object', () => {
		const config = structuredClone(validConfig);
		(config.modules as Record<string, unknown>).settings = 'bad';
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('rejects settings as array', () => {
		const config = structuredClone(validConfig);
		(config.modules as Record<string, unknown>).settings = [];
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('accepts settings with nested unknown values', () => {
		const config = structuredClone(validConfig);
		config.modules.settings = {
			cooling: { relayLabels: ['A', 'B'], nested: { deep: true } }
		};
		expect(appConfigSchema.safeParse(config).success).toBe(true);
	});

	it('accepts empty settings object', () => {
		const config = structuredClone(validConfig);
		config.modules.settings = {};
		expect(appConfigSchema.safeParse(config).success).toBe(true);
	});

	it('rejects rackName as boolean', () => {
		const config = structuredClone(validConfig);
		(config.general as Record<string, unknown>).rackName = true;
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('rejects rackSubtitle as null', () => {
		const config = structuredClone(validConfig);
		(config.general as Record<string, unknown>).rackSubtitle = null;
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('accepts rackSubtitle of exactly 128 characters', () => {
		const config = structuredClone(validConfig);
		config.general.rackSubtitle = 'x'.repeat(128);
		expect(appConfigSchema.safeParse(config).success).toBe(true);
	});

	it('rejects enabled with strings longer than 32 characters', () => {
		const config = structuredClone(validConfig);
		config.modules.enabled = ['x'.repeat(33)];
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('rejects enabled with more than 20 entries', () => {
		const config = structuredClone(validConfig);
		config.modules.enabled = Array.from({ length: 21 }, (_, i) => `mod-${i}`);
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('accepts enabled with exactly 20 entries', () => {
		const config = structuredClone(validConfig);
		config.modules.enabled = Array.from({ length: 20 }, (_, i) => `mod-${i}`);
		expect(appConfigSchema.safeParse(config).success).toBe(true);
	});

	it('rejects rackName as an array', () => {
		const config = structuredClone(validConfig);
		(config.general as Record<string, unknown>).rackName = ['not', 'a', 'string'];
		expect(appConfigSchema.safeParse(config).success).toBe(false);
	});

	it('accepts rackName with special characters', () => {
		const config = structuredClone(validConfig);
		config.general.rackName = 'MY-RACK_v2.0 (test)';
		expect(appConfigSchema.safeParse(config).success).toBe(true);
	});

	it('accepts rackName with unicode characters', () => {
		const config = structuredClone(validConfig);
		config.general.rackName = 'Rack-\u00e9\u00e8\u00ea';
		expect(appConfigSchema.safeParse(config).success).toBe(true);
	});
});

describe('actionRequestSchema extended', () => {
	it('rejects action as null', () => {
		expect(actionRequestSchema.safeParse({ action: null }).success).toBe(false);
	});

	it('rejects action as undefined', () => {
		expect(actionRequestSchema.safeParse({ action: undefined }).success).toBe(false);
	});

	it('rejects action as boolean', () => {
		expect(actionRequestSchema.safeParse({ action: true }).success).toBe(false);
	});

	it('rejects action as array', () => {
		expect(actionRequestSchema.safeParse({ action: ['toggle'] }).success).toBe(false);
	});

	it('rejects action as object', () => {
		expect(actionRequestSchema.safeParse({ action: { name: 'toggle' } }).success).toBe(false);
	});

	it('accepts action with exactly 1 character', () => {
		expect(actionRequestSchema.safeParse({ action: 'x' }).success).toBe(true);
	});

	it('accepts action with special characters', () => {
		expect(actionRequestSchema.safeParse({ action: 'do-something_v2' }).success).toBe(true);
	});

	it('rejects empty object', () => {
		expect(actionRequestSchema.safeParse({}).success).toBe(false);
	});

	it('rejects string input', () => {
		expect(actionRequestSchema.safeParse('toggle').success).toBe(false);
	});

	it('rejects number input', () => {
		expect(actionRequestSchema.safeParse(42).success).toBe(false);
	});

	it('rejects array input', () => {
		expect(actionRequestSchema.safeParse([{ action: 'toggle' }]).success).toBe(false);
	});

	it('rejects undefined input', () => {
		expect(actionRequestSchema.safeParse(undefined).success).toBe(false);
	});

	it('preserves payload value through parsing', () => {
		const result = actionRequestSchema.safeParse({ action: 'toggle', payload: { relay: 2, on: true } });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.payload).toEqual({ relay: 2, on: true });
		}
	});

	it('preserves action value through parsing', () => {
		const result = actionRequestSchema.safeParse({ action: 'my-action' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.action).toBe('my-action');
		}
	});
});
