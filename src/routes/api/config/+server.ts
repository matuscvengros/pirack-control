import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadConfig, saveConfig } from '$lib/server/config';
import type { AppConfig } from '$lib/modules/types';

export const GET: RequestHandler = async () => {
	const config = loadConfig();
	return json(config);
};

export const PUT: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as AppConfig;
	saveConfig(body);
	return json({ success: true });
};
