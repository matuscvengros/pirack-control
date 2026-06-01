import type { PageServerLoad } from './$types';
import { loadConfig } from '$lib/server/config';
import { getEnabledModules } from '$lib/modules/registry';

export const load: PageServerLoad = async () => {
	const config = await loadConfig();
	const modules = getEnabledModules(config.modules.order, config.modules.enabled);

	// Each module refreshes at its own cadence so nothing polls faster than it needs to:
	// uptime tracks the gateway once a minute, network at its configured poll interval,
	// and the local-reading modules at the global UI refresh interval.
	const uiRefreshMs = config.general.uiRefreshSeconds * 1000;
	const networkPoll = config.modules.settings.network?.pollIntervalMs;
	const networkRefreshMs = typeof networkPoll === 'number' && networkPoll >= 500 ? networkPoll : 3000;
	const refreshMsFor = (id: string): number => {
		if (id === 'uptime') return 60_000;
		if (id === 'network') return networkRefreshMs;
		return uiRefreshMs;
	};

	return {
		config: config.general,
		modules: modules.map((m) => ({
			id: m.id, name: m.name, icon: m.icon, expandable: m.expandable, refreshMs: refreshMsFor(m.id)
		}))
	};
};
