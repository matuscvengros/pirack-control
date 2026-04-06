import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getData } from '$lib/modules/rack-info/data.server';
import { saveConfig, getDefaultConfig } from '$lib/server/config';

const TEST_DATA_DIR = path.join(process.cwd(), 'tests', '.test-data-rackinfo');

describe('rack-info data provider', () => {
	beforeEach(() => {
		fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
		process.env.DATA_DIR = TEST_DATA_DIR;
	});

	afterEach(() => {
		fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
		delete process.env.DATA_DIR;
	});

	it('returns default rack name when no config exists', async () => {
		const data = await getData({});
		expect(data.rackName).toBe('HOME-LAB');
		expect(data.rackSubtitle).toBe('192.168.1.50');
	});

	it('returns configured rack name', async () => {
		const config = getDefaultConfig();
		config.general.rackName = 'TEST-RACK';
		config.general.rackSubtitle = '10.0.0.1';
		saveConfig(config);

		const data = await getData({});
		expect(data.rackName).toBe('TEST-RACK');
		expect(data.rackSubtitle).toBe('10.0.0.1');
	});
});
