<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useDevice } from "~/composables/device";
import { useAuthStore } from "~/stores/authStore";

const { deviceClassList } = useDevice();
const { enabled: shaderEnabled } = useShader();

const { isAuthenticated } = storeToRefs(useAuthStore());
if (isAuthenticated.value) {
	await navigateTo("/profile/self", { replace: true });
}
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<ShaderComponent v-if="shaderEnabled" />
		<div :class="$style.container">
			<slot></slot>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	min-height: 100vh;

	.container {
		position: relative;
		z-index: 2;
		min-height: 100vh;
	}
}
</style>
