<script setup lang="ts">
const { isDark } = useTheme();
</script>

<template>
	<div :class="$style.wrapper">
		<UiTransition name="fade-left">
			<img v-show="isDark" src="/icons/hostelite-wide-dark.svg" />
		</UiTransition>
		<UiTransition name="fade-left">
			<img v-show="!isDark" src="/icons/hostelite-wide-light.svg" />
		</UiTransition>
	</div>
</template>

<style module lang="scss">
.wrapper {
	@include unselectable;
	@include color-black;

	position: relative;
	font-size: 32px;
	height: 50px;
	font-family: "Rubik Glitch";

	img {
		height: 100%;
		position: absolute;
		left: 0;
		top: 0;
		transition: $transition;
	}
}
</style>
