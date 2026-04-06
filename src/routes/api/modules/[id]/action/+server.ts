import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadConfig } from '$lib/server/config';
import { getModule } from '$lib/modules/registry';
import { onAction as coolingAction } from '$lib/modules/cooling/data.server';

const actionHandlers: Record<
	string,
	(
		action: string,
		payload: unknown,
		config: Record<string, unknown>
	) => Promise<{ success: boolean; data?: unknown; error?: string }>
> = {
	cooling: coolingAction
};

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = params;
	const meta = getModule(id);
	if (!meta) error(404, `Module "${id}" not found`);
	const handler = actionHandlers[id];
	if (!handler) error(400, `Module "${id}" does not support actions`);
	let body: { action?: string; payload?: unknown };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON body');
	}
	const { action, payload } = body;
	if (!action) error(400, 'Missing "action" field');
	const config = loadConfig();
	const moduleConfig = config.modules.settings[id] ?? meta.defaultConfig;
	const result = await handler(action, payload, moduleConfig);
	return json(result);
};
