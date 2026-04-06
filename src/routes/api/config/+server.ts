import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadConfig, saveConfig } from '$lib/server/config';
import { appConfigSchema, validateRequestHeaders } from '$lib/server/validation';

export const GET: RequestHandler = async () => {
	const config = await loadConfig();
	return json(config);
};

export const PUT: RequestHandler = async ({ request }) => {
	validateRequestHeaders(request);

	const body = await request.json();
	const result = appConfigSchema.safeParse(body);
	if (!result.success) {
		error(400, result.error.errors.map((e) => e.message).join(', '));
	}

	await saveConfig(result.data);
	return json({ success: true });
};
