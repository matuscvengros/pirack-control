<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();
	const isOn = $derived((data.on as boolean) ?? false);
</script>

<div class="text-center px-6">
	<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2">Cooling</div>
	<div class="text-[28px] mb-1">❄️</div>
	<div
		class="inline-block px-3 py-0.5 rounded-full text-[13px] font-semibold border"
		class:bg-[#4ade8020]={isOn}
		class:border-[#4ade8040]={isOn}
		class:text-[#4ade80]={isOn}
		class:bg-[#ef444420]={!isOn}
		class:border-[#ef444440]={!isOn}
		class:text-[#ef4444]={!isOn}
	>
		{isOn ? 'ON' : 'OFF'}
	</div>
</div>
