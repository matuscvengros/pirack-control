<script lang="ts">
	let { data, onRefresh } = $props<{ data: Record<string, unknown>; onRefresh?: () => void }>();
	const isOn = $derived((data.on as boolean) ?? false);
	const relays = $derived((data.relays as boolean[]) ?? [false, false, false, false]);
	const gpioAvailable = $derived((data.gpioAvailable as boolean) ?? false);

	async function toggleCooling() {
		try {
			const res = await fetch('/api/modules/cooling/action', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'toggle' })
			});
			if (res.ok) {
				onRefresh?.();
			} else {
				console.error('Failed to toggle cooling');
			}
		} catch (e) {
			console.error('Toggle error:', e);
		}
	}
</script>

<div class="flex-1 flex items-center justify-center gap-10">
	<div class="text-center">
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2.5">Rack Cooling</div>
		<div class="text-[48px] leading-none">❄️</div>
	</div>
	<button class="cursor-pointer" onclick={toggleCooling}>
		<div class="w-[100px] h-[48px] rounded-full relative transition-colors"
			class:bg-[#4ade80]={isOn}
			class:shadow-[0_0_20px_rgba(74,222,128,0.3)]={isOn}
			class:bg-[#333]={!isOn}
		>
			<div class="w-[42px] h-[42px] rounded-full bg-white absolute top-[3px] shadow-md transition-all"
				class:right-[3px]={isOn}
				class:left-[3px]={!isOn}
			></div>
		</div>
		<div class="text-center mt-2 text-[16px] font-bold tracking-[2px]"
			class:text-[#4ade80]={isOn}
			class:text-[#666]={!isOn}
		>
			{isOn ? 'ON' : 'OFF'}
		</div>
	</button>
	<div class="w-px h-[60%] bg-gradient-to-b from-transparent via-[#1a2040] to-transparent"></div>
	<div>
		<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] mb-2.5">Relay Status</div>
		<div class="flex gap-3">
			{#each relays as state, i}
				<div class="text-center">
					<div class="w-3.5 h-3.5 rounded-full mx-auto mb-1"
						class:bg-[#4ade80]={state}
						class:shadow-[0_0_8px_#4ade8066]={state}
						class:bg-[#333]={!state}
					></div>
					<div class="text-[8px] text-[#4a5580]">R{i + 1}</div>
				</div>
			{/each}
		</div>
		{#if !gpioAvailable}
			<div class="text-[8px] text-[#ef4444] mt-2">GPIO unavailable</div>
		{/if}
	</div>
</div>
