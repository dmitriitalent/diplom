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
			<ShaderComponent :class="$style.shader" :cubes="400" />
		</ClientOnly>
		<div :class="$style.container">
			<slot></slot>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	.shader {
		position: absolute;
		z-index: 1;
		height: 100dvh;
		width: 100%;
	}

	.container {
		@include container;
		position: relative;
		z-index: 2;
		max-height: 100vh;
		min-height: 100vh;
	}
}
</style>
