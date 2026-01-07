<script setup lang="ts">
import { useDevice } from "~/composables/device";

const { deviceClassList } = useDevice();
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<headerComponent></headerComponent>
		<slot></slot>
		<!-- <footerComponent></footerComponent> -->
	</div>
</template>

<style module lang="scss">
.wrapper {
}
</style>
