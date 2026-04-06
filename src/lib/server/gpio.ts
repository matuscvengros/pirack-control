import type { Gpio as GpioType } from 'onoff';

const RELAY_PINS = [19, 13, 6, 5] as const;

let gpioAvailable = false;
let gpios: GpioType[] = [];

try {
	const { Gpio } = await import('onoff');
	if (Gpio.accessible) {
		gpios = RELAY_PINS.map((pin) => new Gpio(pin, 'out'));
		gpioAvailable = true;
		console.log('[GPIO] Initialised relay pins:', RELAY_PINS.join(', '));
	} else {
		console.warn('[GPIO] GPIO not accessible on this platform');
	}
} catch (e) {
	console.warn('[GPIO] onoff not available:', (e as Error).message);
}

export function isGpioAvailable(): boolean {
	return gpioAvailable;
}

export function getRelayStates(): boolean[] {
	if (!gpioAvailable) {
		return RELAY_PINS.map(() => false);
	}
	return gpios.map((gpio) => gpio.readSync() === 1);
}

export function setAllRelays(on: boolean): boolean[] {
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

// Clean up GPIO on process exit
process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('uncaughtException', (err) => {
	console.error('[GPIO] Uncaught exception, cleaning up:', err);
	cleanup();
	process.exit(1);
});
