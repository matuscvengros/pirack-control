<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();
	const txRate = $derived((data.txRate as number) ?? 0);
	const rxRate = $derived((data.rxRate as number) ?? 0);
	const history = $derived((data.history as { rxRate: number; txRate: number }[]) ?? []);

	function formatRate(bytesPerSec: number): string {
		if (bytesPerSec >= 1_000_000) return `${(bytesPerSec / 1_000_000).toFixed(1)} MB/s`;
		if (bytesPerSec >= 1_000) return `${(bytesPerSec / 1_000).toFixed(1)} KB/s`;
		return `${bytesPerSec} B/s`;
	}

	function graphPath(values: number[], viewWidth: number, viewHeight: number): string {
		if (values.length < 2) return '';
		const max = Math.max(...values, 1);
		const step = viewWidth / (values.length - 1);
		return values.map((v, i) => `${i * step},${viewHeight - (v / max) * viewHeight * 0.85}`).join(' ');
	}

	function fillPath(values: number[], viewWidth: number, viewHeight: number): string {
		const line = graphPath(values, viewWidth, viewHeight);
		if (!line) return '';
		return `${line} ${viewWidth},${viewHeight} 0,${viewHeight}`;
	}

	const peakTx = $derived(history.length > 0 ? Math.max(...history.map((h) => h.txRate)) : 0);
	const peakRx = $derived(history.length > 0 ? Math.max(...history.map((h) => h.rxRate)) : 0);
</script>

<div class="flex-1 flex items-center px-5 gap-4">
	<div class="flex-shrink-0 min-w-[140px]">
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2">Network</div>
		<div class="mb-2">
			<span class="text-[#4ade80] text-[12px]">▲ Upload</span>
			<div><span class="text-[22px] font-bold text-[#e2e8f0]">{formatRate(txRate)}</span></div>
		</div>
		<div>
			<span class="text-[#60a5fa] text-[12px]">▼ Download</span>
			<div><span class="text-[22px] font-bold text-[#e2e8f0]">{formatRate(rxRate)}</span></div>
		</div>
	</div>
	<div class="flex-1 h-[80%] bg-white/[0.02] rounded-lg p-2 relative overflow-hidden">
		<svg width="100%" height="100%" viewBox="0 0 400 60" preserveAspectRatio="none">
			{#each [15, 30, 45] as y}
				<line x1="0" y1={y} x2="400" y2={y} stroke="white" stroke-opacity="0.03" stroke-width="0.5" />
			{/each}
			{#if history.length >= 2}
				<polygon points={fillPath(history.map((h) => h.txRate), 400, 60)} fill="#4ade80" opacity="0.1" />
				<polyline points={graphPath(history.map((h) => h.txRate), 400, 60)} fill="none" stroke="#4ade80" stroke-width="2" />
				<polyline points={graphPath(history.map((h) => h.rxRate), 400, 60)} fill="none" stroke="#60a5fa" stroke-width="1.5" opacity="0.7" />
			{/if}
		</svg>
	</div>
	<div class="flex-shrink-0 ml-4 text-[11px] space-y-1.5">
		<div><span class="text-[#4a5580]">Peak ▲</span> <span class="text-[#4ade80] font-semibold">{formatRate(peakTx)}</span></div>
		<div><span class="text-[#4a5580]">Peak ▼</span> <span class="text-[#60a5fa] font-semibold">{formatRate(peakRx)}</span></div>
	</div>
</div>
