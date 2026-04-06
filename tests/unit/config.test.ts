import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { loadConfig, saveConfig, getDefaultConfig } from '$lib/server/config';

const TEST_DATA_DIR = path.join(process.cwd(), 'tests', '.test-data');
const TEST_CONFIG_PATH = path.join(TEST_DATA_DIR, 'config.json');

describe('config', () => {
	beforeEach(() => {
		fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
		process.env.DATA_DIR = TEST_DATA_DIR;
	});

	afterEach(() => {
		fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
		delete process.env.DATA_DIR;
	});

	it('returns default config when no file exists', async () => {
		const config = await loadConfig();
		expect(config.general.rackName).toBe('HOME-LAB');
		expect(config.modules.order).toContain('rack-info');
	});

	it('loads config from file', async () => {
		const custom = getDefaultConfig();
		custom.general.rackName = 'MY-RACK';
		fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(custom));

		const config = await loadConfig();
		expect(config.general.rackName).toBe('MY-RACK');
	});

	it('saves config to file', async () => {
		const config = getDefaultConfig();
		config.general.rackName = 'SAVED-RACK';
		await saveConfig(config);

		const raw = JSON.parse(fs.readFileSync(TEST_CONFIG_PATH, 'utf-8'));
		expect(raw.general.rackName).toBe('SAVED-RACK');
	});
});
