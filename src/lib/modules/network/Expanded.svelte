<script lang="ts">
	import { smoothPath, smoothFillPath, valuesToPoints } from '$lib/utils/smooth-path';
	import { formatRateString, type RateUnits } from './format';

	let { data } = $props<{ data: Record<string, unknown> }>();
	const txRate = $derived((data.txRate as number) ?? 0);
	const rxRate = $derived((data.rxRate as number) ?? 0);
	const history = $derived((data.history as { rxRate: number; txRate: number }[]) ?? []);
	const units = $derived((data.units as RateUnits) ?? 'bytes');
	const isWan = $derived(data.source === 'udm');
	const wanIp = $derived((data.wanIp as string) ?? '');
	const latency = $derived(data.latency as number | null);
	const isp = $derived((data.isp as string) ?? '');
	const connected = $derived(data.connected as boolean | undefined);
	const errorMsg = $derived((data.error as string) ?? '');

	const formatRate = (v: number) => formatRateString(v, units);

	const txPoints = $derived(valuesToPoints(history.map((h) => h.txRate), 400, 60, 0.85));
	const rxPoints = $derived(valuesToPoints(history.map((h) => h.rxRate), 400, 60, 0.85));

	const peakTx = $derived(history.length > 0 ? Math.max(...history.map((h) => h.txRate)) : 0);
	const peakRx = $derived(history.length > 0 ? Math.max(...history.map((h) => h.rxRate)) : 0);
</script>

<div class="flex-1 flex items-center px-5 gap-4">
	<div class="flex-shrink-0 min-w-[140px]">
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2">{isWan ? 'Internet' : 'Network'}</div>
		<div class="mb-2">
			<span class="text-[#4ade80] text-[12px]">▲ Upload</span>
			<div><span class="text-[22px] font-bold text-[#e2e8f0]">{formatRate(txRate)}</span></div>
		</div>
		<div>
			<span class="text-[#60a5fa] text-[12px]">▼ Download</span>
			<div><span class="text-[22px] font-bold text-[#e2e8f0]">{formatRate(rxRate)}</span></div>
		</div>
		{#if isWan}
			<div class="mt-3 text-[10px] space-y-0.5">
				{#if connected}
					{#if isp}<div class="text-[#4a5580]">ISP <span class="text-[#94a3b8]">{isp}</span></div>{/if}
					{#if wanIp}<div class="text-[#4a5580]">WAN <span class="text-[#94a3b8]">{wanIp}</span></div>{/if}
					{#if latency != null}<div class="text-[#4a5580]">Latency <span class="text-[#94a3b8]">{latency} ms</span></div>{/if}
				{:else}
					<div class="text-[#f87171]">⚠ {errorMsg || 'Not connected'}</div>
				{/if}
			</div>
		{/if}
	</div>
	<div class="flex-1 h-[80%] bg-white/[0.02] rounded-lg p-2 relative overflow-hidden">
		<svg width="100%" height="100%" viewBox="0 0 400 60" preserveAspectRatio="none">
			<defs>
				<linearGradient id="txGradExp" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#4ade80" stop-opacity="0.5" />
					<stop offset="40%" stop-color="#4ade80" stop-opacity="0.15" />
					<stop offset="100%" stop-color="#4ade80" stop-opacity="0.02" />
				</linearGradient>
				<linearGradient id="rxGradExp" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#60a5fa" stop-opacity="0.35" />
					<stop offset="40%" stop-color="#60a5fa" stop-opacity="0.1" />
					<stop offset="100%" stop-color="#60a5fa" stop-opacity="0.02" />
				</linearGradient>
			</defs>
			{#each [15, 30, 45] as y}
				<line x1="0" y1={y} x2="400" y2={y} stroke="white" stroke-opacity="0.03" stroke-width="0.5" />
			{/each}
			{#if txPoints.length >= 2}
				<path d={smoothFillPath(txPoints, 400, 60)} fill="url(#txGradExp)" />
				<path d={smoothPath(txPoints)} fill="none" stroke="#4ade80" stroke-width="1.2" opacity="0.9" />
			{/if}
			{#if rxPoints.length >= 2}
				<path d={smoothFillPath(rxPoints, 400, 60)} fill="url(#rxGradExp)" />
				<path d={smoothPath(rxPoints)} fill="none" stroke="#60a5fa" stroke-width="1" opacity="0.6" />
			{/if}
		</svg>
	</div>
	<div class="flex-shrink-0 ml-4 text-[11px] space-y-1.5">
		<div><span class="text-[#4a5580]">Peak ▲</span> <span class="text-[#4ade80] font-semibold">{formatRate(peakTx)}</span></div>
		<div><span class="text-[#4a5580]">Peak ▼</span> <span class="text-[#60a5fa] font-semibold">{formatRate(peakRx)}</span></div>
	</div>
</div>
