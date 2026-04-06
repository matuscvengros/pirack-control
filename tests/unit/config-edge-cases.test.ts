import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { loadConfig, saveConfig, getDefaultConfig } from '$lib/server/config';

const TEST_DATA_DIR = path.join(process.cwd(), 'tests', '.test-data-edge');
const TEST_CONFIG_PATH = path.join(TEST_DATA_DIR, 'config.json');

describe('config edge cases', () => {
	beforeEach(() => {
		fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
		process.env.DATA_DIR = TEST_DATA_DIR;
	});

	afterEach(() => {
		fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
		delete process.env.DATA_DIR;
	});

	it('returns default config for corrupted JSON file', () => {
		fs.writeFileSync(TEST_CONFIG_PATH, 'NOT VALID JSON {{{');
		const config = loadConfig();
		expect(config.general.rackName).toBe('HOME-LAB');
	});

	it('returns default config for empty file', () => {
		fs.writeFileSync(TEST_CONFIG_PATH, '');
		const config = loadConfig();
		expect(config.general.rackName).toBe('HOME-LAB');
	});

	it('creates data directory if it does not exist on save', () => {
		const nestedDir = path.join(TEST_DATA_DIR, 'nested', 'deep');
		process.env.DATA_DIR = nestedDir;

		const config = getDefaultConfig();
		saveConfig(config);

		expect(fs.existsSync(path.join(nestedDir, 'config.json'))).toBe(true);
	});

	it('getDefaultConfig returns a fresh object each call', () => {
		const a = getDefaultConfig();
		const b = getDefaultConfig();
		a.general.rackName = 'MUTATED';
		expect(b.general.rackName).toBe('HOME-LAB');
	});

	it('default config has all five modules in order', () => {
		const config = getDefaultConfig();
		expect(config.modules.order).toEqual([
			'rack-info', 'uptime', 'network', 'temperature', 'cooling'
		]);
		expect(config.modules.enabled).toEqual(config.modules.order);
	});
});
