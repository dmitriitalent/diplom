<script setup lang="ts">
import { useDevice } from "~/composables/device";
import { useAuthStore } from "~/stores/authStore";

const { deviceClassList } = useDevice();

const { isAuthenticated } = useAuthStore();
if (isAuthenticated) {
	const router = useRouter();
	router.push("profile/self");
}
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<ClientOnly>
			<ShaderComponent />
		</ClientOnly>
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
