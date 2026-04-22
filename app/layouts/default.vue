<script setup lang="ts">
import { useDevice } from "~/composables/device";

const { deviceClassList } = useDevice();
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<headerComponent :class="$style.header"></headerComponent>
		<slot></slot>
		<footerComponent></footerComponent>
	</div>
</template>

<style module lang="scss">
.wrapper {
	display: flex;
	flex-direction: column;
	row-gap: 30px;

	.header {
		display: flex;
		z-index: $headerZIndex;
	}
}
</style>
