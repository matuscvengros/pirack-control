<script lang="ts">
	import type { PageData } from './$types';
	import RackInfoConfig from '$lib/modules/rack-info/Config.svelte';
	import UptimeConfig from '$lib/modules/uptime/Config.svelte';
	import NetworkConfig from '$lib/modules/network/Config.svelte';
	import TemperatureConfig from '$lib/modules/temperature/Config.svelte';
	import CoolingConfig from '$lib/modules/cooling/Config.svelte';

	let { data }: { data: PageData } = $props();
	let config = $state(structuredClone(data.config));
	let saving = $state(false);
	let saved = $state(false);
	let expandedModule = $state<string | null>(null);

	async function save() {
		saving = true;
		saved = false;
		try {
			const res = await fetch('/api/config', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(config)
			});
			if (res.ok) saved = true;
		} finally {
			saving = false;
			setTimeout(() => { saved = false; }, 2000);
		}
	}

	function toggleModule(id: string) {
		const idx = config.modules.enabled.indexOf(id);
		if (idx >= 0) {
			config.modules.enabled = config.modules.enabled.filter((m: string) => m !== id);
		} else {
			config.modules.enabled = [...config.modules.enabled, id];
		}
	}

	function moveModule(id: string, direction: -1 | 1) {
		const order = [...config.modules.order];
		const idx = order.indexOf(id);
		const newIdx = idx + direction;
		if (newIdx < 0 || newIdx >= order.length) return;
		[order[idx], order[newIdx]] = [order[newIdx], order[idx]];
		config.modules.order = order;
	}
</script>

<section class="mb-8">
	<h2 class="text-lg font-semibold mb-4 text-[#e2e8f0]">General Settings</h2>
	<div class="bg-[#161a26] rounded-lg p-5 space-y-4">
		<label class="block">
			<span class="text-sm text-[#94a3b8]">Rack Name</span>
			<input type="text" class="mt-1 block w-full bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-2 text-sm text-[#e2e8f0]" bind:value={config.general.rackName} />
		</label>
		<label class="block">
			<span class="text-sm text-[#94a3b8]">Rack Subtitle</span>
			<input type="text" class="mt-1 block w-full bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-2 text-sm text-[#e2e8f0]" bind:value={config.general.rackSubtitle} />
		</label>
		<label class="block">
			<span class="text-sm text-[#94a3b8]">LCD Auto-Return (seconds)</span>
			<input type="number" class="mt-1 block w-full bg-[#1a1f2e] border border-[#2a3040] rounded px-3 py-2 text-sm text-[#e2e8f0]" bind:value={config.general.lcdAutoReturnSeconds} min="10" max="300" />
		</label>
	</div>
</section>

<section class="mb-8">
	<h2 class="text-lg font-semibold mb-4 text-[#e2e8f0]">Modules</h2>
	<div class="space-y-3">
		{#each config.modules.order as moduleId, i}
			{@const mod = data.availableModules.find((m) => m.id === moduleId)}
			{#if mod}
				<div class="bg-[#161a26] rounded-lg overflow-hidden">
					<div class="flex items-center px-5 py-3 gap-4">
						<div class="flex flex-col gap-0.5">
							<button class="text-[#4a5580] hover:text-[#7dd3fc] text-xs disabled:opacity-30" onclick={() => moveModule(moduleId, -1)} disabled={i === 0}>▲</button>
							<button class="text-[#4a5580] hover:text-[#7dd3fc] text-xs disabled:opacity-30" onclick={() => moveModule(moduleId, 1)} disabled={i === config.modules.order.length - 1}>▼</button>
						</div>
						<span class="text-xl">{mod.icon}</span>
						<span class="font-medium flex-1">{mod.name}</span>
						<button class="w-10 h-5 rounded-full relative transition-colors"
							class:bg-[#4ade80]={config.modules.enabled.includes(moduleId)}
							class:bg-[#333]={!config.modules.enabled.includes(moduleId)}
							onclick={() => toggleModule(moduleId)}
						>
							<div class="w-4 h-4 rounded-full bg-white absolute top-0.5 shadow transition-all"
								class:right-0.5={config.modules.enabled.includes(moduleId)}
								class:left-0.5={!config.modules.enabled.includes(moduleId)}
							></div>
						</button>
						<button class="text-sm text-[#4a5580] hover:text-[#7dd3fc]"
							onclick={() => expandedModule = expandedModule === moduleId ? null : moduleId}
						>
							{expandedModule === moduleId ? '▼' : '▶'} Settings
						</button>
					</div>
					{#if expandedModule === moduleId}
						<div class="px-5 pb-4 pt-2 border-t border-[#1e2333]">
							{#if moduleId === 'rack-info'}
								<RackInfoConfig bind:settings={config.modules.settings['rack-info']} />
							{:else if moduleId === 'uptime'}
								<UptimeConfig />
							{:else if moduleId === 'network'}
								<NetworkConfig bind:settings={config.modules.settings['network']} />
							{:else if moduleId === 'temperature'}
								<TemperatureConfig bind:settings={config.modules.settings['temperature']} />
							{:else if moduleId === 'cooling'}
								<CoolingConfig bind:settings={config.modules.settings['cooling']} />
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		{/each}
	</div>
</section>

<div class="flex items-center gap-4">
	<button class="px-6 py-2.5 bg-[#7dd3fc] text-[#0a0a1a] font-semibold rounded-lg hover:bg-[#5bbce6] transition-colors disabled:opacity-50"
		onclick={save} disabled={saving}
	>
		{saving ? 'Saving...' : 'Save Configuration'}
	</button>
	{#if saved}
		<span class="text-sm text-[#4ade80]">✓ Saved</span>
	{/if}
</div>
