<script lang="ts">
	import { smoothPath, smoothFillPath, valuesToPoints } from '$lib/utils/smooth-path';
	import { formatRate, type RateUnits } from './format';

	let { data } = $props<{ data: Record<string, unknown> }>();
	const txRate = $derived((data.txRate as number) ?? 0);
	const rxRate = $derived((data.rxRate as number) ?? 0);
	const history = $derived((data.history as { rxRate: number; txRate: number }[]) ?? []);
	const units = $derived((data.units as RateUnits) ?? 'bytes');
	const isWan = $derived(data.source === 'udm');
	const offline = $derived(data.source === 'udm' && data.connected === false);

	const tx = $derived(formatRate(txRate, units));
	const rx = $derived(formatRate(rxRate, units));

	const txPoints = $derived(valuesToPoints(history.map((h) => h.txRate), 120, 50));
	const rxPoints = $derived(valuesToPoints(history.map((h) => h.rxRate), 120, 50));
</script>

<div class="flex flex-col h-full px-5">
	<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] text-center pt-[70px] mb-8">
		{isWan ? 'Internet' : 'Network'}{#if offline}<span class="text-[#f87171] ml-1">• offline</span>{/if}
	</div>
	<div class="flex items-center gap-4">
		<div class="flex-shrink-0">
			<div class="mb-1">
				<span class="text-[#4ade80] text-[11px] font-medium">▲</span>
				<span class="text-[20px] font-bold text-[#e2e8f0] mx-0.5">{tx.value}</span>
				<span class="text-[10px] text-[#4a5580]">{tx.unit}</span>
			</div>
			<div>
				<span class="text-[#60a5fa] text-[11px] font-medium">▼</span>
				<span class="text-[20px] font-bold text-[#e2e8f0] mx-0.5">{rx.value}</span>
				<span class="text-[10px] text-[#4a5580]">{rx.unit}</span>
			</div>
		</div>
		<div class="flex-1 h-[50px]">
			<svg width="100%" height="100%" viewBox="0 0 120 50" preserveAspectRatio="none">
				<defs>
					<linearGradient id="txGradStrip" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#4ade80" stop-opacity="0.45" />
						<stop offset="100%" stop-color="#4ade80" stop-opacity="0.02" />
					</linearGradient>
					<linearGradient id="rxGradStrip" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#60a5fa" stop-opacity="0.3" />
						<stop offset="100%" stop-color="#60a5fa" stop-opacity="0.02" />
					</linearGradient>
				</defs>
				{#if txPoints.length >= 2}
					<path d={smoothFillPath(txPoints, 120, 50)} fill="url(#txGradStrip)" />
					<path d={smoothPath(txPoints)} fill="none" stroke="#4ade80" stroke-width="1" opacity="0.8" />
				{/if}
				{#if rxPoints.length >= 2}
					<path d={smoothFillPath(rxPoints, 120, 50)} fill="url(#rxGradStrip)" />
					<path d={smoothPath(rxPoints)} fill="none" stroke="#60a5fa" stroke-width="0.8" opacity="0.5" />
				{/if}
			</svg>
		</div>
	</div>
</div>
