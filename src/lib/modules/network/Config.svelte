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
			<span class="text-sm text-[#94a3b8]">UDM Pro host / IP</span>
			<input
				type="text"
				class={inputClass}
				placeholder="192.168.1.1"
				value={(settings.udmHost as string) ?? ''}
				oninput={(e) => (settings.udmHost = e.currentTarget.value.trim())}
			/>
		</label>

		<label class="block">
			<span class="text-sm text-[#94a3b8]">API key</span>
			<input
				type="password"
				class={inputClass}
				placeholder="Settings → Control Plane → Integrations"
				value={(settings.apiKey as string) ?? ''}
				oninput={(e) => (settings.apiKey = e.currentTarget.value)}
			/>
			<span class="text-xs text-[#4a5580]">Read-only local API key. May also be set via the <code>UDM_API_KEY</code> env var.</span>
		</label>

		<div class="grid grid-cols-2 gap-3">
			<label class="block">
				<span class="text-sm text-[#94a3b8]">Site</span>
				<input
					type="text"
					class={inputClass}
					value={(settings.site as string) ?? 'default'}
					oninput={(e) => (settings.site = e.currentTarget.value.trim() || 'default')}
				/>
			</label>
			<label class="block">
				<span class="text-sm text-[#94a3b8]">Poll interval (ms)</span>
				<input
					type="number"
					class={inputClass}
					min="500"
					max="60000"
					step="500"
					value={(settings.pollIntervalMs as number) ?? 2000}
					oninput={(e) => (settings.pollIntervalMs = parseInt(e.currentTarget.value, 10) || 2000)}
				/>
			</label>
		</div>

		<label class="flex items-center gap-2 text-sm text-[#94a3b8]">
			<input
				type="checkbox"
				checked={(settings.insecureTLS as boolean) !== false}
				onchange={(e) => (settings.insecureTLS = e.currentTarget.checked)}
			/>
			Allow self-signed certificate (UniFi default)
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
