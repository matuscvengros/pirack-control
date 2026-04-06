import type { ModuleConfig, ModuleData, ActionResult } from '$lib/modules/types';
import { getRelayStates, setAllRelays, isGpioAvailable } from '$lib/server/gpio';

export async function getData(_config: ModuleConfig): Promise<ModuleData> {
	const relayStates = getRelayStates();
	const anyOn = relayStates.some((s) => s);
	return { on: anyOn, relays: relayStates, gpioAvailable: isGpioAvailable() };
}

export async function onAction(
	action: string,
	_payload: unknown,
	_config: ModuleConfig
): Promise<ActionResult> {
	if (action === 'toggle') {
		const currentStates = getRelayStates();
		const anyOn = currentStates.some((s) => s);
		const newStates = setAllRelays(!anyOn);
		return { success: true, data: { on: !anyOn, relays: newStates } };
	}
	return { success: false, error: `Unknown action: ${action}` };
}
