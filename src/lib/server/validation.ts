import { z } from 'zod';
import { error } from '@sveltejs/kit';

const MAX_BODY_SIZE = 65536; // 64KB

export const appConfigSchema = z.object({
	general: z.object({
		rackName: z.string().min(1).max(64),
		rackSubtitle: z.string().max(128),
		lcdAutoReturnSeconds: z.number().int().min(10).max(300)
	}),
	modules: z.object({
		order: z.array(z.string().max(32)).max(20),
		enabled: z.array(z.string().max(32)).max(20),
		settings: z.record(z.string(), z.record(z.string(), z.unknown()))
	})
});

export const actionRequestSchema = z.object({
	action: z.string().min(1).max(32),
	payload: z.unknown().optional()
});

export function validateRequestHeaders(request: Request): void {
	const contentType = request.headers.get('content-type');
	if (!contentType?.includes('application/json')) {
		error(415, 'Content-Type must be application/json');
	}

	const contentLength = request.headers.get('content-length');
	if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
		error(413, 'Request body too large');
	}
}
