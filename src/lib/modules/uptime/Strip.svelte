<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();
	const days = $derived((data.days as number) ?? 0);
	const hours = $derived((data.hours as number) ?? 0);
	const minutes = $derived((data.minutes as number) ?? 0);
	const seconds = $derived((data.seconds as number) ?? 0);

	const hh = $derived(String(hours).padStart(2, '0'));
	const mm = $derived(String(minutes).padStart(2, '0'));
	const ss = $derived(String(seconds).padStart(2, '0'));
</script>

<div class="flex flex-col h-full px-6">
	<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] text-center pt-[70px] mb-8">Uptime</div>
	<div class="flex flex-col items-center gap-2">
		<div class="text-[34px] font-bold text-[#7dd3fc] leading-none">
			{days} <span class="text-[16px] text-[#4a5580] font-normal">days</span>
		</div>
		<div class="font-mono text-[24px] font-semibold text-[#94a3b8] tracking-[3px] leading-none">
			{hh}<span class="text-[#334170] font-normal">:</span>{mm}<span class="text-[#334170] font-normal">:</span><span class="text-[#64748b]">{ss}</span>
		</div>
	</div>
</div>
