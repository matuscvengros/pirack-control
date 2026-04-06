<script lang="ts">
	import type { PageData } from './$types';
	import RackInfoStrip from '$lib/modules/rack-info/Strip.svelte';
	import UptimeStrip from '$lib/modules/uptime/Strip.svelte';
	import NetworkStrip from '$lib/modules/network/Strip.svelte';
	import TemperatureStrip from '$lib/modules/temperature/Strip.svelte';
	import CoolingStrip from '$lib/modules/cooling/Strip.svelte';
	import UptimeExpanded from '$lib/modules/uptime/Expanded.svelte';
	import NetworkExpanded from '$lib/modules/network/Expanded.svelte';
	import TemperatureExpanded from '$lib/modules/temperature/Expanded.svelte';
	import CoolingExpanded from '$lib/modules/cooling/Expanded.svelte';
	import HomeButton from '$lib/components/lcd/HomeButton.svelte';
	import AutoReturn from '$lib/components/lcd/AutoReturn.svelte';

	let { data }: { data: PageData } = $props();

	let expandedModule = $state<string | null>(null);
	let moduleData = $state<Record<string, Record<string, unknown>>>({});

	async function fetchModuleData(id: string) {
		try {
			const res = await fetch(`/api/modules/${id}/data`);
			if (res.ok) {
				moduleData[id] = await res.json();
			}
		} catch (e) {
			console.error(`Failed to fetch data for ${id}:`, e);
		}
	}

	function fetchAllData() {
		for (const mod of data.modules) {
			fetchModuleData(mod.id);
		}
	}

	$effect(() => {
		fetchAllData();
		const interval = setInterval(fetchAllData, 5000);
		return () => clearInterval(interval);
	});

	function expandPanel(id: string) {
		const mod = data.modules.find((m) => m.id === id);
		if (mod?.expandable) {
			expandedModule = id;
		}
	}

	function goHome() {
		expandedModule = null;
	}
</script>

{#if expandedModule}
	<div class="flex h-full w-full relative">
		<HomeButton onclick={goHome} />
		<AutoReturn seconds={data.config.lcdAutoReturnSeconds} onReturn={goHome} />
		{#if expandedModule === 'uptime'}
			<UptimeExpanded data={moduleData['uptime'] ?? {}} />
		{:else if expandedModule === 'network'}
			<NetworkExpanded data={moduleData['network'] ?? {}} />
		{:else if expandedModule === 'temperature'}
			<TemperatureExpanded data={moduleData['temperature'] ?? {}} />
		{:else if expandedModule === 'cooling'}
			<CoolingExpanded data={moduleData['cooling'] ?? {}} />
		{/if}
	</div>
{:else}
	<div class="flex h-full w-full relative">
		{#each data.modules as mod}
			<button
				class="flex items-center justify-center h-full border-r border-[#1a2040] bg-gradient-to-b from-[#0d1120] to-[#090d18] hover:from-[#111830] hover:to-[#0d1120] transition-all cursor-pointer flex-1 min-w-0 text-left"
				class:from-[#0f1628]={mod.id === 'rack-info'}
				class:to-[#0a0f1e]={mod.id === 'rack-info'}
				class:!cursor-default={!mod.expandable}
				onclick={() => expandPanel(mod.id)}
			>
				{#if mod.id === 'rack-info'}
					<RackInfoStrip data={moduleData['rack-info'] ?? {}} />
				{:else if mod.id === 'uptime'}
					<UptimeStrip data={moduleData['uptime'] ?? {}} />
				{:else if mod.id === 'network'}
					<NetworkStrip data={moduleData['network'] ?? {}} />
				{:else if mod.id === 'temperature'}
					<TemperatureStrip data={moduleData['temperature'] ?? {}} />
				{:else if mod.id === 'cooling'}
					<CoolingStrip data={moduleData['cooling'] ?? {}} />
				{/if}
			</button>
		{/each}
		<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#7dd3fc44] via-[#4ade8044] to-[#7dd3fc22]"></div>
	</div>
{/if}
