<script setup lang="ts">
import { useDevice } from "~/composables/device";

const { deviceClassList } = useDevice();
const { enabled: shaderEnabled } = useShader();
</script>

<template>
	<ShaderComponent v-if="shaderEnabled" />
	<div :class="[$style.wrapper, ...deviceClassList]">
		<headerComponent :class="$style.header"></headerComponent>
		<main :class="$style.main">
			<slot></slot>
		</main>
		<footerComponent></footerComponent>
	</div>
</template>

<style module lang="scss">
.wrapper {
	display: flex;
	position: relative;
	flex-direction: column;
	row-gap: 30px;
	min-height: 100dvh;

	.header {
		display: flex;
		z-index: $headerZIndex;
	}

	.main {
		flex: 1 0 auto;
		display: flex;
		flex-direction: column;
	}
}
</style>
