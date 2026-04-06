import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { loadConfig, saveConfig, getDefaultConfig } from '$lib/server/config';

const TEST_DATA_DIR = path.join(process.cwd(), 'tests', '.test-data-merge');
const TEST_CONFIG_PATH = path.join(TEST_DATA_DIR, 'config.json');

describe('config deep merge behavior', () => {
	beforeEach(() => {
		fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
		process.env.DATA_DIR = TEST_DATA_DIR;
	});

	afterEach(() => {
		fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
		delete process.env.DATA_DIR;
	});

	it('merges partial general section with defaults', async () => {
		const partial = { general: { rackName: 'CUSTOM' } };
		fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(partial));

		const config = await loadConfig();
		expect(config.general.rackName).toBe('CUSTOM');
		expect(config.general.rackSubtitle).toBe('192.168.1.50'); // default
		expect(config.general.lcdAutoReturnSeconds).toBe(60); // default
	});

	it('uses default modules when modules section is missing', async () => {
		const partial = { general: { rackName: 'CUSTOM' } };
		fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(partial));

		const config = await loadConfig();
		const defaults = getDefaultConfig();
		expect(config.modules.order).toEqual(defaults.modules.order);
		expect(config.modules.enabled).toEqual(defaults.modules.enabled);
	});

	it('uses default order/enabled when only settings are provided', async () => {
		const partial = {
			general: { rackName: 'X', rackSubtitle: 'Y', lcdAutoReturnSeconds: 30 },
			modules: {
				settings: { cooling: { relayLabels: ['A', 'B', 'C', 'D'] } }
			}
		};
		fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(partial));

		const config = await loadConfig();
		const defaults = getDefaultConfig();
		expect(config.modules.order).toEqual(defaults.modules.order);
		expect(config.modules.enabled).toEqual(defaults.modules.enabled);
	});

	it('overrides module settings entirely per module key (shallow merge)', async () => {
		// This demonstrates the shallow merge behavior: if you set temperature settings,
		// you must include all keys, because the whole object replaces the default
		const partial = {
			general: { rackName: 'X', rackSubtitle: 'Y', lcdAutoReturnSeconds: 30 },
			modules: {
				order: ['rack-info'],
				enabled: ['rack-info'],
				settings: {
					temperature: { dangerThreshold: 50 }
					// Note: probes key is missing -- this is the shallow merge limitation
				}
			}
		};
		fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(partial));

		const config = await loadConfig();
		// The temperature settings from the file replace the defaults entirely
		expect(config.modules.settings.temperature).toEqual({ dangerThreshold: 50 });
		// probes is NOT preserved because settings merge is shallow per-module
	});

	it('preserves default settings for modules not in saved config', async () => {
		const partial = {
			general: { rackName: 'X', rackSubtitle: 'Y', lcdAutoReturnSeconds: 30 },
			modules: {
				order: ['rack-info'],
				enabled: ['rack-info'],
				settings: {
					cooling: { relayLabels: ['X1', 'X2', 'X3', 'X4'] }
				}
			}
		};
		fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(partial));

		const config = await loadConfig();
		const defaults = getDefaultConfig();
		// temperature default settings should be preserved since only cooling was overridden
		expect(config.modules.settings.temperature).toEqual(defaults.modules.settings.temperature);
	});

	it('saveConfig then loadConfig roundtrip preserves data', async () => {
		const original = getDefaultConfig();
		original.general.rackName = 'ROUND-TRIP';
		original.general.lcdAutoReturnSeconds = 120;
		original.modules.order = ['cooling', 'network'];
		original.modules.enabled = ['cooling'];
		original.modules.settings = {
			cooling: { relayLabels: ['Fan1', 'Fan2', 'Fan3', 'Fan4'] }
		};

		await saveConfig(original);
		const loaded = await loadConfig();

		expect(loaded.general.rackName).toBe('ROUND-TRIP');
		expect(loaded.general.lcdAutoReturnSeconds).toBe(120);
		expect(loaded.modules.order).toEqual(['cooling', 'network']);
		expect(loaded.modules.enabled).toEqual(['cooling']);
		expect(loaded.modules.settings.cooling).toEqual({ relayLabels: ['Fan1', 'Fan2', 'Fan3', 'Fan4'] });
	});

	it('getDefaultConfig returns fresh objects (mutation isolation)', () => {
		const a = getDefaultConfig();
		const b = getDefaultConfig();

		// Mutate deeply
		a.general.rackName = 'MUTATED';
		a.modules.order.push('extra-module');
		a.modules.enabled.push('extra-module');
		(a.modules.settings.temperature as Record<string, unknown>).dangerThreshold = 99;
		(a.modules.settings.cooling as Record<string, unknown>).relayLabels = [];

		// b should be unaffected
		expect(b.general.rackName).toBe('HOME-LAB');
		expect(b.modules.order).not.toContain('extra-module');
		expect(b.modules.enabled).not.toContain('extra-module');
	});

	it('handles config file with extra unknown fields gracefully', async () => {
		const configWithExtra = {
			general: {
				rackName: 'EXTRA',
				rackSubtitle: 'sub',
				lcdAutoReturnSeconds: 30,
				unknownField: 'should be ignored by spread'
			},
			modules: {
				order: ['rack-info'],
				enabled: ['rack-info'],
				settings: {}
			},
			extraTopLevel: true
		};
		fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(configWithExtra));

		const config = await loadConfig();
		expect(config.general.rackName).toBe('EXTRA');
		// The extra field is included due to spread, but doesn't break anything
		expect((config.general as Record<string, unknown>).unknownField).toBe('should be ignored by spread');
	});
});
