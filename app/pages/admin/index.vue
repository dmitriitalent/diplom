<script setup lang="ts">
import { useAuthStore } from "~/stores/authStore";
import { useDevice } from "~/composables/device";

const { deviceClassList } = useDevice();

const auth = useAuthStore();

if (!auth.isAdmin) {
	await navigateTo("/");
}
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<h1 :class="$style.pageTitle">Панель администратора</h1>

			<section :class="$style.section">
				<AdminVerifications />
			</section>

			<section :class="$style.section">
				<AdminTemplatePreviews />
			</section>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	min-height: 100dvh;

	.container {
		@include container;

		padding: 40px 0 100px;
		display: flex;
		flex-direction: column;
		row-gap: 40px;

		@include respond-to(mobile) {
			@include container(mobile);

			padding: 16px 0 60px;
			row-gap: 16px;
		}
	}

	.pageTitle {
		@include reset;
		@include title-l;
		@include color-black;

		@include respond-to(mobile) {
			@include title-m;
		}
	}

	.section {
		padding: 28px;
		border-radius: 12px;

		@include color-white-bg(0.72);
		@include shadow;

		backdrop-filter: blur(12px);

		@include respond-to(mobile) {
			padding: 14px;
			border-radius: 10px;
		}
	}
}
</style>
