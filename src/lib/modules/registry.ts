import type { ModuleMeta } from '$lib/modules/types';
import rackInfoMeta from './rack-info/meta';
import uptimeMeta from './uptime/meta';
import networkMeta from './network/meta';
import temperatureMeta from './temperature/meta';
import coolingMeta from './cooling/meta';

export const registry: ModuleMeta[] = [
	rackInfoMeta,
	uptimeMeta,
	networkMeta,
	temperatureMeta,
	coolingMeta
];

export function getModule(id: string): ModuleMeta | undefined {
	return registry.find((m) => m.id === id);
}

export function getEnabledModules(order: string[], enabled: string[]): ModuleMeta[] {
	return order
		.filter((id) => enabled.includes(id))
		.map((id) => getModule(id))
		.filter((m): m is ModuleMeta => m !== undefined);
}
