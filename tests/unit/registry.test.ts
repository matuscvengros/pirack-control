import { describe, it, expect } from 'vitest';
import { registry, getModule, getEnabledModules } from '$lib/modules/registry';

describe('registry', () => {
	it('contains all five modules', () => {
		const ids = registry.map((m) => m.id);
		expect(ids).toContain('rack-info');
		expect(ids).toContain('uptime');
		expect(ids).toContain('network');
		expect(ids).toContain('temperature');
		expect(ids).toContain('cooling');
	});

	it('getModule returns a module by id', () => {
		const mod = getModule('rack-info');
		expect(mod).toBeDefined();
		expect(mod!.name).toBe('Rack Info');
	});

	it('getModule returns undefined for unknown id', () => {
		expect(getModule('nonexistent')).toBeUndefined();
	});

	it('getEnabledModules respects order and enabled list', () => {
		const modules = getEnabledModules(
			['network', 'rack-info'],
			['rack-info', 'network', 'uptime']
		);
		expect(modules.map((m) => m.id)).toEqual(['network', 'rack-info']);
	});
});
