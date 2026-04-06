import type { ModuleConfig, ModuleData } from '$lib/modules/types';
import { loadConfig } from '$lib/server/config';

export async function getData(_config: ModuleConfig): Promise<ModuleData> {
	const appConfig = await loadConfig();
	return {
		rackName: appConfig.general.rackName,
		rackSubtitle: appConfig.general.rackSubtitle
	};
}
