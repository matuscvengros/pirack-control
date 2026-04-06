import type { ModuleMeta } from '$lib/modules/types';

const meta: ModuleMeta = {
	id: 'cooling',
	name: 'Cooling',
	icon: '❄️',
	expandable: true,
	defaultConfig: { relayLabels: ['R1', 'R2', 'R3', 'R4'] }
};

export default meta;
