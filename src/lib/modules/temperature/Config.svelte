<script lang="ts">
	let { settings = $bindable({}) } = $props<{ settings: Record<string, unknown> }>();
	let dangerThreshold = $derived((settings.dangerThreshold as number) ?? 45);
</script>
<label class="block mb-3">
	<span class="text-sm text-[#94a3b8]">Danger Threshold (°C)</span>
	<input type="number" class="mt-1 block w-full bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-2 text-sm text-[#e2e8f0]"
		value={dangerThreshold}
		oninput={(e) => { settings.dangerThreshold = parseInt(e.currentTarget.value, 10); }}
		min="20" max="80"
	/>
</label>
