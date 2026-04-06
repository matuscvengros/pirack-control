<script lang="ts">
	let { onclick } = $props<{ onclick: () => void }>();
</script>

<button
	class="flex items-center justify-center w-14 h-full bg-white/[0.03] border-r border-[#1a2040] cursor-pointer hover:bg-white/[0.06] transition-colors flex-shrink-0 text-2xl"
	{onclick}
>
	🏠
</button>
