<script setup lang="ts">
const props = defineProps({
	src: {
		type: String,
		default: "",
	},
});

const hasSrc = computed(() => {
	const s = props.src?.trim() ?? "";
	if (!s) return false;
	if (/guid=(undefined|null)?$/.test(s)) return false;
	return true;
});
</script>

<template>
	<div :class="$style.wrapper">
		<img v-if="hasSrc" :class="$style.image" :src="props.src" />
		<div v-else :class="$style.fallback"></div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	height: 100%;
	width: 100%;

	.image {
		@include unselectable;

		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.fallback {
		width: 100%;
		height: 100%;
		background: var(--theme-cover-gradient);
	}
}
</style>
