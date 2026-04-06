import type { ModuleMeta } from '$lib/modules/types';

const meta: ModuleMeta = {
	id: 'temperature',
	name: 'Temperature',
	icon: '🌡️',
	expandable: true,
	defaultConfig: { refreshInterval: 10000, dangerThreshold: 45, probes: [] }
};

export default meta;
