<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();
	const days = $derived((data.days as number) ?? 0);
	const hours = $derived((data.hours as number) ?? 0);
	const minutes = $derived((data.minutes as number) ?? 0);
	const totalSeconds = $derived((data.totalSeconds as number) ?? 0);
</script>

<div class="flex-1 flex items-center justify-center gap-16 text-[#e2e8f0]">
	<div>
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-3">System Uptime</div>
		<div class="flex items-baseline gap-2">
			<span class="text-[48px] font-bold leading-none">{days}</span>
			<span class="text-[16px] text-[#4a5580]">days</span>
			<span class="text-[48px] font-bold leading-none">{hours}</span>
			<span class="text-[16px] text-[#4a5580]">hrs</span>
			<span class="text-[36px] font-semibold text-[#94a3b8] leading-none">{minutes}</span>
			<span class="text-[14px] text-[#4a5580]">min</span>
		</div>
	</div>
	<div class="w-px h-[60%] bg-gradient-to-b from-transparent via-[#1a2040] to-transparent"></div>
	<div class="text-[12px] text-[#4a5580] leading-relaxed">
		<div>Total: <span class="text-[#94a3b8]">{Math.floor(totalSeconds / 3600).toLocaleString()} hours</span></div>
	</div>
</div>
