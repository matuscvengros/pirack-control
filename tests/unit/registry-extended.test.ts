import { describe, it, expect } from 'vitest';
import { registry, getModule, getEnabledModules } from '$lib/modules/registry';
import { getDefaultConfig } from '$lib/server/config';

describe('registry module meta validation', () => {
	it('every module has a non-empty id', () => {
		for (const mod of registry) {
			expect(mod.id).toBeTruthy();
			expect(typeof mod.id).toBe('string');
			expect(mod.id.length).toBeGreaterThan(0);
		}
	});

	it('every module has a non-empty name', () => {
		for (const mod of registry) {
			expect(mod.name).toBeTruthy();
			expect(typeof mod.name).toBe('string');
			expect(mod.name.length).toBeGreaterThan(0);
		}
	});

	it('every module has a non-empty icon', () => {
		for (const mod of registry) {
			expect(mod.icon).toBeTruthy();
			expect(typeof mod.icon).toBe('string');
			expect(mod.icon.length).toBeGreaterThan(0);
		}
	});

	it('every module has a boolean expandable field', () => {
		for (const mod of registry) {
			expect(typeof mod.expandable).toBe('boolean');
		}
	});

	it('every module has a defaultConfig object', () => {
		for (const mod of registry) {
			expect(mod.defaultConfig).toBeDefined();
			expect(typeof mod.defaultConfig).toBe('object');
			expect(mod.defaultConfig).not.toBeNull();
		}
	});

	it('no two modules share the same id', () => {
		const ids = registry.map((m) => m.id);
		const uniqueIds = new Set(ids);
		expect(uniqueIds.size).toBe(ids.length);
	});

	it('no two modules share the same name', () => {
		const names = registry.map((m) => m.name);
		const uniqueNames = new Set(names);
		expect(uniqueNames.size).toBe(names.length);
	});

	it('registry has exactly 5 modules', () => {
		expect(registry.length).toBe(5);
	});
});

describe('getModule extended', () => {
	it('returns correct module for each known id', () => {
		const expectedIds = ['rack-info', 'uptime', 'network', 'temperature', 'cooling'];
		for (const id of expectedIds) {
			const mod = getModule(id);
			expect(mod).toBeDefined();
			expect(mod!.id).toBe(id);
		}
	});

	it('returns undefined for empty string', () => {
		expect(getModule('')).toBeUndefined();
	});

	it('is case-sensitive', () => {
		expect(getModule('Rack-Info')).toBeUndefined();
		expect(getModule('COOLING')).toBeUndefined();
		expect(getModule('Network')).toBeUndefined();
	});
});

describe('getEnabledModules extended', () => {
	it('returns empty array when order is empty', () => {
		const result = getEnabledModules([], ['rack-info', 'uptime']);
		expect(result).toEqual([]);
	});

	it('returns empty array when enabled is empty', () => {
		const result = getEnabledModules(['rack-info', 'uptime'], []);
		expect(result).toEqual([]);
	});

	it('returns empty array when both are empty', () => {
		const result = getEnabledModules([], []);
		expect(result).toEqual([]);
	});

	it('returns empty array when all modules are disabled', () => {
		const result = getEnabledModules(['rack-info', 'uptime', 'network'], []);
		expect(result).toEqual([]);
	});

	it('filters out unknown module ids', () => {
		const result = getEnabledModules(['nonexistent', 'rack-info'], ['nonexistent', 'rack-info']);
		expect(result.length).toBe(1);
		expect(result[0].id).toBe('rack-info');
	});

	it('preserves order from the order array', () => {
		const result = getEnabledModules(
			['cooling', 'network', 'rack-info'],
			['rack-info', 'network', 'cooling']
		);
		expect(result.map((m) => m.id)).toEqual(['cooling', 'network', 'rack-info']);
	});

	it('ignores enabled modules not in order', () => {
		const result = getEnabledModules(
			['rack-info'],
			['rack-info', 'uptime', 'network']
		);
		expect(result.length).toBe(1);
		expect(result[0].id).toBe('rack-info');
	});

	it('returns all modules when all are enabled and ordered', () => {
		const allIds = registry.map((m) => m.id);
		const result = getEnabledModules(allIds, allIds);
		expect(result.length).toBe(registry.length);
	});

	it('handles duplicate ids in order array', () => {
		const result = getEnabledModules(
			['rack-info', 'rack-info', 'uptime'],
			['rack-info', 'uptime']
		);
		// Should return rack-info twice if duplicated in order
		expect(result.length).toBe(3);
		expect(result[0].id).toBe('rack-info');
		expect(result[1].id).toBe('rack-info');
		expect(result[2].id).toBe('uptime');
	});
});

describe('integration: default config matches registry', () => {
	it('default config modules.order contains exactly the registry module ids', () => {
		const config = getDefaultConfig();
		const registryIds = registry.map((m) => m.id);
		expect(config.modules.order.sort()).toEqual(registryIds.sort());
	});

	it('default config modules.enabled contains exactly the registry module ids', () => {
		const config = getDefaultConfig();
		const registryIds = registry.map((m) => m.id);
		expect(config.modules.enabled.sort()).toEqual(registryIds.sort());
	});

	it('every module in registry is in the default order', () => {
		const config = getDefaultConfig();
		for (const mod of registry) {
			expect(config.modules.order).toContain(mod.id);
		}
	});

	it('every module in default order exists in registry', () => {
		const config = getDefaultConfig();
		for (const id of config.modules.order) {
			expect(getModule(id)).toBeDefined();
		}
	});
});
