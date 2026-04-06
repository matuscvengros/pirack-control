import type { PageServerLoad } from './$types';
import { loadConfig } from '$lib/server/config';
import { registry } from '$lib/modules/registry';

export const load: PageServerLoad = async () => {
	const config = await loadConfig();
	return {
		config,
		availableModules: registry.map((m) => ({
			id: m.id, name: m.name, icon: m.icon
		}))
	};
};
