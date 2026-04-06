<script lang="ts">
	let { data } = $props<{ data: Record<string, unknown> }>();
	const rackName = $derived((data.rackName as string) ?? 'HOME-LAB');
	const rackSubtitle = $derived((data.rackSubtitle as string) ?? '');
</script>

<div class="flex flex-col h-full px-7">
	<div class="text-[9px] text-[#4a5580] uppercase tracking-[2px] text-center pt-[70px] mb-8">Server Rack</div>
	<div class="flex flex-col items-center">
		<div class="text-[26px] font-bold text-[#7dd3fc] tracking-wide leading-none">{rackName}</div>
		{#if rackSubtitle}
			<div class="text-[11px] text-[#334170] mt-2">{rackSubtitle}</div>
		{/if}
	</div>
</div>
