import type { ModuleMeta } from '$lib/modules/types';

const meta: ModuleMeta = {
	id: 'temperature',
	name: 'Temperature',
	icon: '🌡️',
	expandable: true,
	defaultConfig: { dangerThreshold: 45, probes: [] }
};

export default meta;
