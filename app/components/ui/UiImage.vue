<script setup lang="ts">
const props = defineProps({
	src: {
		type: String,
		required: true,
	},
});
</script>

<template>
	<div :class="$style.wrapper">
		<img :class="$style.image" :src="props.src" />
	</div>
</template>

<style module lang="scss">
.wrapper {
	height: 100%;
	width: 100%;

	.image {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}
</style>
