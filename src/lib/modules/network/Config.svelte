<script lang="ts">
	let { settings = $bindable({}) } = $props<{ settings: Record<string, unknown> }>();
	let refreshInterval = $derived((settings.refreshInterval as number) ?? 5000);
</script>
<label class="block mb-3">
	<span class="text-sm text-[#94a3b8]">Refresh Interval (ms)</span>
	<input type="number" class="mt-1 block w-full bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-2 text-sm text-[#e2e8f0]"
		value={refreshInterval}
		oninput={(e) => { settings.refreshInterval = parseInt(e.currentTarget.value, 10); }}
		min="1000" step="1000"
	/>
</label>
