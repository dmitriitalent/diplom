<script setup lang="ts">
defineProps({
	welcome: {
		type: Boolean,
		default: false,
	},
});
</script>

<template>
	<div :class="$style.wrapper">
		<UiLogo></UiLogo>
	</div>
</template>

<style module lang="scss">
.wrapper {
	@include color-white-bg;
	@include shadow();

	height: 300px;
	width: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>
