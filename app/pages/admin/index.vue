<script setup lang="ts">
useSeoMeta({
	title: "Админ-панель",
	robots: "noindex, nofollow",
});

import { useAuthStore } from "~/stores/authStore";
import { useDevice } from "~/composables/device";

const { deviceClassList } = useDevice();

const auth = useAuthStore();

// Доступ — COMMANDANT и выше. Внутренние разделы скрываются по ролям отдельно.
if (!auth.isCommandant) {
	await navigateTo("/");
}
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<h1 :class="$style.pageTitle">Панель администратора</h1>

			<nav :class="$style.nav">
				<RouterLink to="/admin/residents" :class="$style.navLink">
					<Icon
						name="mdi:account-group-outline"
						:class="$style.navIcon"
					/>
					<span :class="$style.navLabel">Проживающие</span>
				</RouterLink>
			</nav>

			<section :class="$style.section">
				<AdminVerifications />
			</section>

			<section v-if="auth.isAdmin" :class="$style.section">
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

	.nav {
		display: flex;
		flex-wrap: wrap;
		column-gap: 10px;
		row-gap: 10px;

		.navLink {
			display: inline-flex;
			align-items: center;
			column-gap: 8px;
			padding: 12px 18px;
			border-radius: 10px;
			text-decoration: none;
			transition: background-color $transition-fast;

			@include color-white-bg(0.7);
			@include color-black;
			@include text-m;
			@include shadow;

			&:hover {
				@include color-accent-bg(0.18);
			}

			.navIcon {
				width: 22px;
				height: 22px;
			}

			.navLabel {
				font-weight: 500;
			}
		}
	}
}
</style>
