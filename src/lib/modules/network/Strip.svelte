<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();
	const txRate = $derived((data.txRate as number) ?? 0);
	const rxRate = $derived((data.rxRate as number) ?? 0);
	const history = $derived((data.history as { rxRate: number; txRate: number }[]) ?? []);

	function formatRate(bytesPerSec: number): { value: string; unit: string } {
		if (bytesPerSec >= 1_000_000) return { value: (bytesPerSec / 1_000_000).toFixed(1), unit: 'MB/s' };
		if (bytesPerSec >= 1_000) return { value: (bytesPerSec / 1_000).toFixed(1), unit: 'KB/s' };
		return { value: bytesPerSec.toString(), unit: 'B/s' };
	}

	const tx = $derived(formatRate(txRate));
	const rx = $derived(formatRate(rxRate));

	function sparklinePath(values: number[], height: number): string {
		if (values.length < 2) return '';
		const max = Math.max(...values, 1);
		const step = 120 / (values.length - 1);
		return values.map((v, i) => `${i * step},${height - (v / max) * height}`).join(' ');
	}
</script>

<div class="flex items-center px-5 gap-4">
	<div class="flex-shrink-0">
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2">Network</div>
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
	<div class="flex-1 h-[70%]">
		<svg width="100%" height="100%" viewBox="0 0 120 50" preserveAspectRatio="none">
			{#if history.length >= 2}
				<polyline points={sparklinePath(history.map((h) => h.txRate), 50)} fill="none" stroke="#4ade80" stroke-width="1.5" />
				<polyline points={sparklinePath(history.map((h) => h.rxRate), 50)} fill="none" stroke="#60a5fa" stroke-width="1.2" opacity="0.6" />
			{/if}
		</svg>
	</div>
</div>
