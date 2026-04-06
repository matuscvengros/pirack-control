import type { Gpio as GpioType } from 'onoff';

const RELAY_PINS = [19, 13, 6, 5] as const;

let gpioAvailable: boolean | null = null;
let gpios: GpioType[] = [];

async function ensureInit(): Promise<void> {
	if (gpioAvailable !== null) return;

	try {
		const { Gpio } = await import('onoff');
		if (Gpio.accessible) {
			gpios = RELAY_PINS.map((pin) => new Gpio(pin, 'out'));
			gpioAvailable = true;
			console.log('[GPIO] Initialised relay pins:', RELAY_PINS.join(', '));

			process.on('SIGINT', () => { cleanup(); process.exit(0); });
			process.on('SIGTERM', () => { cleanup(); process.exit(0); });
		} else {
			gpioAvailable = false;
			console.warn('[GPIO] GPIO not accessible on this platform');
		}
	} catch (e) {
		gpioAvailable = false;
		console.warn('[GPIO] onoff not available:', (e as Error).message);
	}
}

export async function isGpioAvailable(): Promise<boolean> {
	await ensureInit();
	return gpioAvailable!;
}

export async function getRelayStates(): Promise<boolean[]> {
	await ensureInit();
	if (!gpioAvailable) {
		return RELAY_PINS.map(() => false);
	}
	return gpios.map((gpio) => gpio.readSync() === 1);
}

export async function setAllRelays(on: boolean): Promise<boolean[]> {
	await ensureInit();
	if (!gpioAvailable) {
		return RELAY_PINS.map(() => false);
	}
	const value = on ? 1 : 0;
	gpios.forEach((gpio) => gpio.writeSync(value));
	return getRelayStates();
}

export function cleanup(): void {
	if (gpioAvailable) {
		gpios.forEach((gpio) => gpio.unexport());
		console.log('[GPIO] Cleaned up relay pins');
	}
}
