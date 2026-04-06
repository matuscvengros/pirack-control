<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen bg-[#0f1117] text-[#e2e8f0] font-['Inter',system-ui,sans-serif]">
	<header class="border-b border-[#1e2333] px-6 py-4">
		<h1 class="text-xl font-bold text-[#7dd3fc]">PiRack Control</h1>
		<p class="text-sm text-[#4a5580]">Configuration Dashboard</p>
	</header>
	<main class="max-w-4xl mx-auto p-6">
		{@render children()}
	</main>
</div>
