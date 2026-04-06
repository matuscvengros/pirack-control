<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();
	const current = $derived((data.current as number | null) ?? null);
	const high = $derived((data.high as number | null) ?? null);
	const history = $derived((data.history as { timestamp: number; value: number }[]) ?? []);

	function sparklinePath(values: number[]): string {
		if (values.length < 2) return '';
		const min = Math.min(...values) - 2;
		const max = Math.max(...values) + 2;
		const range = max - min || 1;
		const step = 100 / (values.length - 1);
		return values.map((v, i) => `${i * step},${40 - ((v - min) / range) * 40}`).join(' ');
	}
</script>

<div class="flex items-center px-5 gap-3.5">
	<div class="flex-shrink-0">
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2">Temperature</div>
		<div class="flex items-baseline gap-0.5">
			{#if current !== null}
				<span class="text-[34px] font-bold text-[#fb923c] leading-none">{Math.round(current)}</span>
				<span class="text-[16px] text-[#9a5c2e] font-medium">°C</span>
			{:else}
				<span class="text-[24px] text-[#4a5580]">--</span>
			{/if}
		</div>
		{#if high !== null}
			<div class="text-[9px] text-[#4a5580] mt-1">▲ {high}° peak</div>
		{/if}
	</div>
	<div class="flex-1 h-[65%] max-w-[140px]">
		<svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
			{#if history.length >= 2}
				<polyline points={sparklinePath(history.map((h) => h.value))} fill="none" stroke="#fb923c" stroke-width="1.5" />
			{/if}
		</svg>
	</div>
</div>
