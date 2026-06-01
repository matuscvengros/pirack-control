<script lang="ts">
	let { settings = $bindable({}) } = $props<{ settings: Record<string, unknown> }>();

	const source = $derived((settings.source as string) ?? 'udm');
	const inputClass =
		'mt-1 block w-full bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-2 text-sm text-[#e2e8f0]';
</script>

<div class="space-y-3">
	<label class="block">
		<span class="text-sm text-[#94a3b8]">Source</span>
		<select
			class={inputClass}
			value={source}
			onchange={(e) => (settings.source = e.currentTarget.value)}
		>
			<option value="udm">UniFi gateway — internet (WAN)</option>
			<option value="local">This Pi's network interface</option>
		</select>
	</label>

	{#if source === 'udm'}
		<label class="block">
			<span class="text-sm text-[#94a3b8]">Bandwidth poll interval (ms)</span>
			<input
				type="number"
				class={inputClass}
				min="500"
				max="60000"
				step="500"
				value={(settings.pollIntervalMs as number) ?? 3000}
				oninput={(e) => (settings.pollIntervalMs = parseInt(e.currentTarget.value, 10) || 3000)}
			/>
			<span class="text-xs text-[#4a5580]">
				How often the gateway is polled for WAN throughput. Uses the shared
				<span class="text-[#94a3b8]">Gateway Connection</span> above. The gateway only
				recomputes WAN rates every few seconds, so values below ~3000ms mostly add load
				without fresher data.
			</span>
		</label>
	{/if}

	<label class="block">
		<span class="text-sm text-[#94a3b8]">Units</span>
		<select
			class={inputClass}
			value={(settings.units as string) ?? 'bits'}
			onchange={(e) => (settings.units = e.currentTarget.value)}
		>
			<option value="bits">Megabits per second (Mbps)</option>
			<option value="bytes">Megabytes per second (MB/s)</option>
		</select>
	</label>
</div>
