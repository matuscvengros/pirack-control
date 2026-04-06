<script lang="ts">
	let { seconds, onReturn } = $props<{ seconds: number; onReturn: () => void }>();
	let remaining = $state(seconds);

	$effect(() => {
		remaining = seconds;
		const interval = setInterval(() => {
			remaining--;
			if (remaining <= 0) {
				clearInterval(interval);
				onReturn();
			}
		}, 1000);
		return () => clearInterval(interval);
	});
</script>

<div class="absolute top-1.5 right-3 text-[9px] text-[#333] font-mono">
	⏱ {remaining}s
</div>
