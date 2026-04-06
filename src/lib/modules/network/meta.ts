import type { ModuleMeta } from '$lib/modules/types';

const meta: ModuleMeta = {
	id: 'network',
	name: 'Network',
	icon: '📡',
	expandable: true,
	defaultConfig: { refreshInterval: 5000 }
};

export default meta;
