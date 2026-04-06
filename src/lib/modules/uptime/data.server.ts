import os from 'os';
import type { ModuleConfig, ModuleData } from '$lib/modules/types';

export async function getData(_config: ModuleConfig): Promise<ModuleData> {
	const uptimeSeconds = os.uptime();
	const days = Math.floor(uptimeSeconds / 86400);
	const hours = Math.floor((uptimeSeconds % 86400) / 3600);
	const minutes = Math.floor((uptimeSeconds % 3600) / 60);
	const seconds = Math.floor(uptimeSeconds % 60);
	return { totalSeconds: uptimeSeconds, days, hours, minutes, seconds };
}
