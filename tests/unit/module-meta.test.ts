import { describe, it, expect } from 'vitest';
import rackInfoMeta from '$lib/modules/rack-info/meta';
import uptimeMeta from '$lib/modules/uptime/meta';
import networkMeta from '$lib/modules/network/meta';
import temperatureMeta from '$lib/modules/temperature/meta';
import coolingMeta from '$lib/modules/cooling/meta';

const allMeta = [rackInfoMeta, uptimeMeta, networkMeta, temperatureMeta, coolingMeta];

describe('individual module meta', () => {
	it('rack-info meta has correct values', () => {
		expect(rackInfoMeta.id).toBe('rack-info');
		expect(rackInfoMeta.name).toBe('Rack Info');
		expect(rackInfoMeta.expandable).toBe(false);
		expect(rackInfoMeta.defaultConfig).toEqual({});
	});

	it('uptime meta has correct values', () => {
		expect(uptimeMeta.id).toBe('uptime');
		expect(uptimeMeta.name).toBe('Uptime');
		expect(uptimeMeta.expandable).toBe(true);
		expect(uptimeMeta.defaultConfig).toEqual({});
	});

	it('network meta has correct values', () => {
		expect(networkMeta.id).toBe('network');
		expect(networkMeta.name).toBe('Network');
		expect(networkMeta.expandable).toBe(true);
		expect(networkMeta.defaultConfig).toEqual({});
	});

	it('temperature meta has correct values', () => {
		expect(temperatureMeta.id).toBe('temperature');
		expect(temperatureMeta.name).toBe('Temperature');
		expect(temperatureMeta.expandable).toBe(true);
		expect(temperatureMeta.defaultConfig).toEqual({ dangerThreshold: 45, probes: [] });
	});

	it('cooling meta has correct values', () => {
		expect(coolingMeta.id).toBe('cooling');
		expect(coolingMeta.name).toBe('Cooling');
		expect(coolingMeta.expandable).toBe(true);
		expect(coolingMeta.defaultConfig).toEqual({ relayLabels: ['R1', 'R2', 'R3', 'R4'] });
	});

	it('all modules have non-empty icon strings', () => {
		for (const meta of allMeta) {
			expect(meta.icon.length).toBeGreaterThan(0);
		}
	});

	it('rack-info is the only non-expandable module', () => {
		const nonExpandable = allMeta.filter((m) => !m.expandable);
		expect(nonExpandable.length).toBe(1);
		expect(nonExpandable[0].id).toBe('rack-info');
	});

	it('expandable modules are uptime, network, temperature, cooling', () => {
		const expandable = allMeta.filter((m) => m.expandable).map((m) => m.id).sort();
		expect(expandable).toEqual(['cooling', 'network', 'temperature', 'uptime']);
	});

	it('module ids use lowercase-with-hyphens convention', () => {
		for (const meta of allMeta) {
			expect(meta.id).toMatch(/^[a-z][a-z0-9-]*$/);
		}
	});

	it('module names are Title Case', () => {
		for (const meta of allMeta) {
			expect(meta.name[0]).toBe(meta.name[0].toUpperCase());
		}
	});
});
