<script lang="ts">
	import { smoothPath, smoothFillPath, valuesToPointsRange } from '$lib/utils/smooth-path';

	let { data } = $props<{ data: Record<string, unknown> }>();
	const current = $derived((data.current as number | null) ?? null);
	const high = $derived((data.high as number | null) ?? null);
	const low = $derived((data.low as number | null) ?? null);
	const avg = $derived((data.avg as number | null) ?? null);
	const dangerThreshold = $derived((data.dangerThreshold as number) ?? 45);
	const history = $derived((data.history as { timestamp: number; value: number }[]) ?? []);

	const tempPoints = $derived(valuesToPointsRange(
		history.map((h) => h.value), 600, 80, 3, 0.9
	));

	function dangerY(): number {
		const values = history.map((h) => h.value);
		if (values.length === 0) return 10;
		const min = Math.min(...values) - 3;
		const max = Math.max(...values, dangerThreshold) + 3;
		const range = max - min || 1;
		return 80 - ((dangerThreshold - min) / range) * 80 * 0.9;
	}
</script>

<div class="flex-1 flex items-stretch">
	<div class="flex flex-col justify-center px-5 flex-shrink-0 min-w-[140px] border-r border-[#1a2040]">
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2">Temperature</div>
		<div class="flex items-baseline gap-0.5 mb-2.5">
			{#if current !== null}
				<span class="text-[38px] font-bold text-[#fb923c] leading-none">{current.toFixed(1)}</span>
				<span class="text-[18px] text-[#9a5c2e]">°C</span>
			{:else}
				<span class="text-[28px] text-[#4a5580]">--</span>
			{/if}
		</div>
		<div class="text-[10px] text-[#4a5580] leading-relaxed space-y-0.5">
			<div>▲ High: <span class="text-[#ef4444]">{high !== null ? `${high}°` : '--'}</span></div>
			<div>▼ Low: <span class="text-[#60a5fa]">{low !== null ? `${low}°` : '--'}</span></div>
			<div>⌀ Avg: <span class="text-[#94a3b8]">{avg !== null ? `${avg}°` : '--'}</span></div>
		</div>
	</div>
	<div class="flex-1 flex flex-col px-4 py-2.5">
		<div class="flex-1 relative">
			<svg width="100%" height="100%" viewBox="0 0 600 80" preserveAspectRatio="none">
				<defs>
					<linearGradient id="tempGradExp" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#fb923c" stop-opacity="0.45" />
						<stop offset="35%" stop-color="#fb923c" stop-opacity="0.15" />
						<stop offset="100%" stop-color="#fb923c" stop-opacity="0.02" />
					</linearGradient>
				</defs>
				{#each [16, 32, 48, 64] as y}
					<line x1="0" y1={y} x2="600" y2={y} stroke="white" stroke-opacity="0.025" stroke-width="0.5" />
				{/each}
				{#if history.length > 0}
					<line x1="0" y1={dangerY()} x2="600" y2={dangerY()} stroke="#ef4444" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.3" />
				{/if}
				{#if tempPoints.length >= 2}
					<path d={smoothFillPath(tempPoints, 600, 80)} fill="url(#tempGradExp)" />
					<path d={smoothPath(tempPoints)} fill="none" stroke="#fb923c" stroke-width="1.2" opacity="0.9" />
					{@const last = tempPoints[tempPoints.length - 1]}
					<circle cx={last[0]} cy={last[1]} r="2.5" fill="#fb923c" />
					<circle cx={last[0]} cy={last[1]} r="5" fill="#fb923c" opacity="0.15" />
				{/if}
			</svg>
		</div>
		<div class="flex justify-between text-[8px] text-[#333] pt-0.5">
			<span>24h ago</span><span>20h</span><span>16h</span><span>12h</span><span>8h</span><span>4h</span><span>now</span>
		</div>
	</div>
</div>
