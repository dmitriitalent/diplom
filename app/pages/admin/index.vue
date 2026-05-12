<script setup lang="ts">
import { useAuthStore } from "~/stores/authStore";
import { jwtDecode } from "jwt-decode";

const { at } = useAuthStore();
const isAdmin = jwtDecode(at as string).roles.includes("ADMIN");

if (!isAdmin) {
	await navigateTo("/");
}
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.container">
			<h1 :class="$style.pageTitle">Панель администратора</h1>

			<section :class="$style.section">
				<AdminTemplatePreviews />
			</section>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	min-height: 100dvh;
}

.container {
	@include container;

	padding: 40px 0 100px;
	display: flex;
	flex-direction: column;
	row-gap: 40px;

	@include respond-to(mobile) {
		@include container(mobile);

		padding: 24px 0 60px;
	}
}

.pageTitle {
	@include reset;
	@include title-l;
	@include color-black;
}

.section {
	padding: 28px;
	border-radius: 12px;

	@include color-white-bg;
	@include shadow;

	@include respond-to(mobile) {
		padding: 16px;
	}
}
</style>
