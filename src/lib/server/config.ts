import fs from 'fs/promises';
import { mkdirSync } from 'fs';
import path from 'path';
import type { AppConfig, UdmConnection } from '$lib/modules/types';

export function getDataDir(): string {
	return process.env.DATA_DIR || path.join(process.cwd(), 'data');
}

function getConfigPath(): string {
	return path.join(getDataDir(), 'config.json');
}

export function getDefaultConfig(): AppConfig {
	return {
		general: {
			rackName: 'PIRACK',
			rackSubtitle: '192.168.1.50',
			lcdAutoReturnSeconds: 60,
			uiRefreshSeconds: 1
		},
		udm: {
			host: '',
			apiKey: '',
			site: 'default',
			insecureTLS: true
		},
		modules: {
			order: ['rack-info', 'uptime', 'network', 'temperature', 'cooling'],
			enabled: ['rack-info', 'uptime', 'network', 'temperature', 'cooling'],
			settings: {
				network: {
					source: 'udm',
					pollIntervalMs: 3000,
					units: 'bits'
				},
				temperature: {
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

/**
 * Resolve the shared gateway connection block, migrating from the legacy layout
 * where host/apiKey/site/insecureTLS lived under the network module's settings.
 * Returns the defaults when neither a `udm` block nor legacy fields are present.
 */
function mergeUdm(defaults: UdmConnection, parsed: Record<string, unknown>): UdmConnection {
	const parsedUdm = parsed.udm;
	if (parsedUdm && typeof parsedUdm === 'object') {
		return { ...defaults, ...(parsedUdm as Partial<UdmConnection>) };
	}
	// Legacy migration: lift connection fields out of the network module settings.
	const net = (parsed.modules as Record<string, unknown> | undefined)?.settings as
		| Record<string, Record<string, unknown>>
		| undefined;
	const legacy = net?.network;
	if (legacy && typeof legacy === 'object') {
		return {
			host: typeof legacy.udmHost === 'string' ? legacy.udmHost : defaults.host,
			apiKey: typeof legacy.apiKey === 'string' ? legacy.apiKey : defaults.apiKey,
			site: typeof legacy.site === 'string' ? legacy.site : defaults.site,
			insecureTLS: legacy.insecureTLS !== false
		};
	}
	return defaults;
}

export async function loadConfig(): Promise<AppConfig> {
	const configPath = getConfigPath();
	const defaults = getDefaultConfig();
	try {
		const raw = await fs.readFile(configPath, 'utf-8');
		const parsed = JSON.parse(raw);
		// Deep merge with defaults
		return {
			general: { ...defaults.general, ...parsed.general },
			udm: mergeUdm(defaults.udm, parsed),
			modules: {
				order: parsed.modules?.order ?? defaults.modules.order,
				enabled: parsed.modules?.enabled ?? defaults.modules.enabled,
				settings: {
					...defaults.modules.settings,
					...parsed.modules?.settings
				}
			}
		};
	} catch (e) {
		console.warn('[Config] Could not read config file, using defaults:', (e as Error).message);
		return defaults;
	}
}

/**
 * Resolve the effective gateway connection: a saved config value takes precedence,
 * falling back to the matching environment variable, so a server can be configured
 * entirely via `.env`.
 */
export function resolveUdmConnection(udm: UdmConnection): UdmConnection {
	return {
		host: (String(udm.host ?? '').trim() || process.env.UDM_HOST) ?? '',
		apiKey: (String(udm.apiKey ?? '').trim() || process.env.UDM_API_KEY) ?? '',
		site: String(udm.site ?? '').trim() || process.env.UDM_SITE || 'default',
		insecureTLS: udm.insecureTLS !== false
	};
}

export async function saveConfig(config: AppConfig): Promise<void> {
	const configPath = getConfigPath();
	const dir = path.dirname(configPath);
	mkdirSync(dir, { recursive: true });
	await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}
