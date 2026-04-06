<script lang="ts">
	let { settings = $bindable({}) } = $props<{ settings: Record<string, unknown> }>();
	let relayLabels = $derived((settings.relayLabels as string[]) ?? ['R1', 'R2', 'R3', 'R4']);
</script>
<div class="space-y-2">
	<span class="text-sm text-[#94a3b8]">Relay Labels</span>
	{#each relayLabels as label, i}
		<label class="flex items-center gap-2">
			<span class="text-xs text-[#4a5580] w-16">Relay {i + 1}:</span>
			<input type="text" class="bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-1.5 text-sm text-[#e2e8f0] w-32"
				value={label}
				oninput={(e) => {
					const newLabels = [...relayLabels];
					newLabels[i] = e.currentTarget.value;
					settings.relayLabels = newLabels;
				}}
			/>
		</label>
	{/each}
</div>
