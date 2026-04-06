import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { loadConfig, saveConfig, getDefaultConfig } from '$lib/server/config';

const TEST_DATA_DIR = path.join(process.cwd(), 'tests', '.test-data-config-ext');
const TEST_CONFIG_PATH = path.join(TEST_DATA_DIR, 'config.json');

describe('config extended', () => {
	beforeEach(() => {
		fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
		process.env.DATA_DIR = TEST_DATA_DIR;
	});

	afterEach(() => {
		fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
		delete process.env.DATA_DIR;
	});

	it('saveConfig writes valid JSON', async () => {
		const config = getDefaultConfig();
		await saveConfig(config);
		const raw = fs.readFileSync(TEST_CONFIG_PATH, 'utf-8');
		expect(() => JSON.parse(raw)).not.toThrow();
	});

	it('saveConfig writes pretty-printed JSON (indented with 2 spaces)', async () => {
		const config = getDefaultConfig();
		await saveConfig(config);
		const raw = fs.readFileSync(TEST_CONFIG_PATH, 'utf-8');
		expect(raw).toContain('  ');
		expect(raw).toBe(JSON.stringify(config, null, 2));
	});

	it('multiple saveConfig calls overwrite the same file', async () => {
		const config1 = getDefaultConfig();
		config1.general.rackName = 'FIRST';
		await saveConfig(config1);

		const config2 = getDefaultConfig();
		config2.general.rackName = 'SECOND';
		await saveConfig(config2);

		const loaded = await loadConfig();
		expect(loaded.general.rackName).toBe('SECOND');
	});

	it('loadConfig returns a complete AppConfig shape', async () => {
		const config = await loadConfig();
		expect(config).toHaveProperty('general');
		expect(config).toHaveProperty('modules');
		expect(config.general).toHaveProperty('rackName');
		expect(config.general).toHaveProperty('rackSubtitle');
		expect(config.general).toHaveProperty('lcdAutoReturnSeconds');
		expect(config.modules).toHaveProperty('order');
		expect(config.modules).toHaveProperty('enabled');
		expect(config.modules).toHaveProperty('settings');
	});

	it('loadConfig merges partial config with defaults correctly', async () => {
		const partial = {
			general: { rackSubtitle: 'custom-subtitle' },
			modules: { settings: {} }
		};
		fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(partial));

		const config = await loadConfig();
		expect(config.general.rackSubtitle).toBe('custom-subtitle');
		expect(config.general.rackName).toBe('HOME-LAB'); // default
		expect(config.general.lcdAutoReturnSeconds).toBe(60); // default
	});

	it('deeply nested partial config merges with defaults', async () => {
		const partial = {
			general: { lcdAutoReturnSeconds: 120 },
			modules: {
				settings: {
					temperature: { dangerThreshold: 50 },
					newModule: { key: 'value' }
				}
			}
		};
		fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(partial));

		const config = await loadConfig();
		expect(config.general.lcdAutoReturnSeconds).toBe(120);
		expect(config.general.rackName).toBe('HOME-LAB');
		expect(config.modules.settings.temperature).toEqual({ dangerThreshold: 50 });
		expect(config.modules.settings.newModule).toEqual({ key: 'value' });
		// Default settings for modules not in partial should be preserved
		expect(config.modules.settings.network).toEqual({});
	});

	it('config with only general section uses default modules', async () => {
		fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify({ general: { rackName: 'OnlyGeneral' } }));

		const config = await loadConfig();
		const defaults = getDefaultConfig();
		expect(config.modules.order).toEqual(defaults.modules.order);
		expect(config.modules.enabled).toEqual(defaults.modules.enabled);
	});

	it('config with only modules section uses default general', async () => {
		fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify({
			modules: { order: ['rack-info'], enabled: ['rack-info'], settings: {} }
		}));

		const config = await loadConfig();
		const defaults = getDefaultConfig();
		expect(config.general).toEqual(defaults.general);
	});

	it('loadConfig with empty object uses all defaults', async () => {
		fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify({}));

		const config = await loadConfig();
		const defaults = getDefaultConfig();
		expect(config.general).toEqual(defaults.general);
		expect(config.modules.order).toEqual(defaults.modules.order);
		expect(config.modules.enabled).toEqual(defaults.modules.enabled);
	});

	it('getDefaultConfig general values are correct', () => {
		const config = getDefaultConfig();
		expect(config.general.rackName).toBe('HOME-LAB');
		expect(config.general.rackSubtitle).toBe('192.168.1.50');
		expect(config.general.lcdAutoReturnSeconds).toBe(60);
	});

	it('getDefaultConfig modules.settings has expected keys', () => {
		const config = getDefaultConfig();
		expect(config.modules.settings).toHaveProperty('network');
		expect(config.modules.settings).toHaveProperty('temperature');
		expect(config.modules.settings).toHaveProperty('cooling');
	});

	it('getDefaultConfig temperature settings have dangerThreshold and probes', () => {
		const config = getDefaultConfig();
		const temp = config.modules.settings.temperature as Record<string, unknown>;
		expect(temp.dangerThreshold).toBe(45);
		expect(temp.probes).toEqual([]);
	});

	it('getDefaultConfig cooling settings have relayLabels', () => {
		const config = getDefaultConfig();
		const cooling = config.modules.settings.cooling as Record<string, unknown>;
		expect(cooling.relayLabels).toEqual(['R1', 'R2', 'R3', 'R4']);
	});

	it('getDefaultConfig returns independent array references', () => {
		const a = getDefaultConfig();
		const b = getDefaultConfig();
		a.modules.order.push('extra');
		expect(b.modules.order).not.toContain('extra');

		a.modules.enabled.push('extra');
		expect(b.modules.enabled).not.toContain('extra');
	});

	it('getDefaultConfig returns independent settings references', () => {
		const a = getDefaultConfig();
		const b = getDefaultConfig();
		(a.modules.settings.cooling as Record<string, unknown>).relayLabels = ['X'];
		expect((b.modules.settings.cooling as Record<string, unknown>).relayLabels).toEqual(['R1', 'R2', 'R3', 'R4']);
	});
});
