import type { PageServerLoad } from './$types';
import { loadConfig } from '$lib/server/config';
import { getEnabledModules } from '$lib/modules/registry';

export const load: PageServerLoad = async () => {
	const config = await loadConfig();
	const modules = getEnabledModules(config.modules.order, config.modules.enabled);
	return {
		config: config.general,
		modules: modules.map((m) => ({
			id: m.id, name: m.name, icon: m.icon, expandable: m.expandable
		}))
	};
};
