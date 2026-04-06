<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();
	const days = $derived((data.days as number) ?? 0);
	const hours = $derived((data.hours as number) ?? 0);
	const minutes = $derived((data.minutes as number) ?? 0);
</script>

<div class="text-center px-6">
	<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-1.5">Uptime</div>
	<div class="flex items-baseline justify-center gap-1">
		<span class="text-[32px] font-bold text-[#e2e8f0] leading-none">{days}</span>
		<span class="text-[13px] text-[#4a5580] mr-1.5">days</span>
		<span class="text-[32px] font-bold text-[#e2e8f0] leading-none">{hours}</span>
		<span class="text-[13px] text-[#4a5580] mr-1.5">hrs</span>
		<span class="text-[22px] font-semibold text-[#94a3b8] leading-none">{minutes}</span>
		<span class="text-[11px] text-[#4a5580]">min</span>
	</div>
</div>
