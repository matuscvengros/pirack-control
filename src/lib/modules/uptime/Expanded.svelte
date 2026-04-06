<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();
	const days = $derived((data.days as number) ?? 0);
	const hours = $derived((data.hours as number) ?? 0);
	const minutes = $derived((data.minutes as number) ?? 0);
	const seconds = $derived((data.seconds as number) ?? 0);
	const totalSeconds = $derived((data.totalSeconds as number) ?? 0);

	const hh = $derived(String(hours).padStart(2, '0'));
	const mm = $derived(String(minutes).padStart(2, '0'));
	const ss = $derived(String(seconds).padStart(2, '0'));
</script>

<div class="flex-1 flex items-center justify-center gap-16 text-[#e2e8f0]">
	<div class="text-center">
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-4">System Uptime</div>
		<div class="text-[52px] font-bold text-[#7dd3fc] leading-none mb-3">
			{days} <span class="text-[22px] text-[#4a5580] font-normal">days</span>
		</div>
		<div class="font-mono text-[40px] font-semibold text-[#94a3b8] tracking-[4px] leading-none">
			{hh}<span class="text-[#334170] font-normal">:</span>{mm}<span class="text-[#334170] font-normal">:</span><span class="text-[#64748b]">{ss}</span>
		</div>
	</div>
	<div class="w-px h-[60%] bg-gradient-to-b from-transparent via-[#1a2040] to-transparent"></div>
	<div class="text-[12px] text-[#4a5580] leading-relaxed">
		<div>Total: <span class="text-[#94a3b8]">{Math.floor(totalSeconds / 3600).toLocaleString()} hours</span></div>
	</div>
</div>
