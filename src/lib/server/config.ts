import fs from 'fs';
import path from 'path';
import type { AppConfig } from '$lib/modules/types';

function getDataDir(): string {
	return process.env.DATA_DIR || path.join(process.cwd(), 'data');
}

function getConfigPath(): string {
	return path.join(getDataDir(), 'config.json');
}

export function getDefaultConfig(): AppConfig {
	return {
		general: {
			rackName: 'HOME-LAB',
			rackSubtitle: '192.168.1.50',
			lcdAutoReturnSeconds: 60
		},
		modules: {
			order: ['rack-info', 'uptime', 'network', 'temperature', 'cooling'],
			enabled: ['rack-info', 'uptime', 'network', 'temperature', 'cooling'],
			settings: {
				network: { refreshInterval: 5000 },
				temperature: {
					refreshInterval: 10000,
					dangerThreshold: 45,
					probes: []
				},
				cooling: {
					relayLabels: ['R1', 'R2', 'R3', 'R4']
				}
			}
		}
	};
}

export function loadConfig(): AppConfig {
	const configPath = getConfigPath();
	try {
		const raw = fs.readFileSync(configPath, 'utf-8');
		return JSON.parse(raw) as AppConfig;
	} catch {
		return getDefaultConfig();
	}
}

export function saveConfig(config: AppConfig): void {
	const configPath = getConfigPath();
	const dir = path.dirname(configPath);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
