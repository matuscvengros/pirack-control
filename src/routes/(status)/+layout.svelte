<script lang="ts">
	let { children } = $props();
</script>

<div class="lcd-root w-[1424px] h-[280px] bg-[#07080f] overflow-hidden font-['Inter',system-ui,sans-serif]">
	{@render children()}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #000;
		overflow: hidden;
	}
</style>
