import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadConfig } from '$lib/server/config';
import { registry } from '$lib/modules/registry';

export const GET: RequestHandler = async () => {
	const config = await loadConfig();
	const modules = registry.map((m) => ({
		id: m.id,
		name: m.name,
		icon: m.icon,
		expandable: m.expandable,
		enabled: config.modules.enabled.includes(m.id),
		order: config.modules.order.indexOf(m.id)
	}));
	modules.sort((a, b) => {
		// Modules not in the order array (-1) sort to the end
		const aOrder = a.order === -1 ? Infinity : a.order;
		const bOrder = b.order === -1 ? Infinity : b.order;
		return aOrder - bOrder;
	});
	return json(modules);
};
