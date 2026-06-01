import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadConfig, resolveUdmConnection } from '$lib/server/config';
import type { UdmConnection } from '$lib/modules/types';
import { getModule } from '$lib/modules/registry';
import { getData as getRackInfoData } from '$lib/modules/rack-info/data.server';
import { getData as getUptimeData } from '$lib/modules/uptime/data.server';
import { getData as getNetworkData } from '$lib/modules/network/data.server';
import { getData as getTemperatureData } from '$lib/modules/temperature/data.server';
import { getData as getCoolingData } from '$lib/modules/cooling/data.server';

// Only the network and uptime providers read the second `udm` argument; the
// local-source providers accept a single argument and ignore it.
const dataProviders: Record<
	string,
	(config: Record<string, unknown>, udm: UdmConnection) => Promise<Record<string, unknown>>
> = {
	'rack-info': getRackInfoData,
	uptime: getUptimeData,
	network: getNetworkData,
	temperature: getTemperatureData,
	cooling: getCoolingData
};

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	const meta = getModule(id);
	if (!meta) error(404, `Module "${id}" not found`);
	const provider = dataProviders[id];
	if (!provider) error(404, `No data provider for module "${id}"`);
	const config = await loadConfig();
	const moduleConfig = config.modules.settings[id] ?? meta.defaultConfig;
	const data = await provider(moduleConfig, resolveUdmConnection(config.udm));
	return json(data);
};
