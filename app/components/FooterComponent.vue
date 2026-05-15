<script setup lang="ts">
import { useDevice } from "~/composables/device";

defineProps({
	welcome: {
		type: Boolean,
		default: false,
	},
});

const { install, showInstallButton } = useInstallPrompt();
const { isDevice, deviceClassList } = useDevice();
const year = new Date().getFullYear();
</script>

<template>
	<footer :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.inner">
			<!-- ── Big CTA card ──────────────────────────────────────── -->
			<div v-if="showInstallButton" :class="$style.cta">
				<div :class="$style.ctaBody">
					<div :class="$style.eyebrow">Hostelite в кармане</div>
					<h2 :class="$style.ctaTitle">
						Установите приложение на телефон
					</h2>
					<p :class="$style.ctaText">
						Push-уведомления о стирках, обходах и новостях. Быстрый
						доступ к чатам и расписаниям с главного экрана — без
						браузера.
					</p>
				</div>
				<UiButton
					accent
					size="medium"
					:class="$style.ctaBtn"
					@click="install"
				>
					<Icon
						name="material-symbols:install-mobile-rounded"
						:class="$style.ctaBtnIcon"
					/>
					Скачать приложение
				</UiButton>
			</div>

			<!-- ── Brand row (mobile only, above columns) ───────────── -->
			<div
				v-if="isDevice('mobile')"
				:class="[$style.brandCol, $style.brandRow]"
			>
				<UiLogo :class="$style.logo" />
				<p :class="$style.tagline">
					Вся инфраструктура общежития в одном месте — соседи,
					расписания, услуги и чаты.
				</p>
			</div>

			<!-- ── Columns ─────────────────────────────────────────── -->
			<div :class="$style.cols">
				<div v-if="isDevice('desktop')" :class="$style.brandCol">
					<UiLogo :class="$style.logo" />
					<p :class="$style.tagline">
						Вся инфраструктура общежития в одном месте — соседи,
						расписания, услуги и чаты.
					</p>
				</div>

				<nav :class="$style.navCol">
					<div :class="$style.colTitle">Разделы</div>
					<RouterLink to="/activities" :class="$style.navLink">
						Афиша
					</RouterLink>
					<RouterLink to="/services" :class="$style.navLink">
						Услуги
					</RouterLink>
					<RouterLink to="/catalog" :class="$style.navLink">
						Каталог
					</RouterLink>
					<RouterLink to="/news" :class="$style.navLink">
						Новости
					</RouterLink>
					<RouterLink to="/schedule" :class="$style.navLink">
						Расписание
					</RouterLink>
				</nav>

				<div :class="$style.aboutCol">
					<div :class="$style.colTitle">О проекте</div>
					<p :class="$style.aboutText">
						Дипломный проект. beta · открыто для проживающих
						общежития Икар.
					</p>
					<div :class="$style.location">
						<Icon
							name="mdi:map-marker-outline"
							:class="$style.locationIcon"
						/>
						ул. Дубосековская 13
					</div>
				</div>
			</div>

			<!-- ── Bottom bar ───────────────────────────────────────── -->
			<div :class="$style.bottom">© {{ year }} Hostelite</div>
		</div>
	</footer>
</template>

<style module lang="scss">
.wrapper {
	@include color-white-bg;

	width: 100%;
	box-sizing: border-box;
	padding: 48px 0 24px;
	border-top: 1px solid rgba($color-black-rgb, 0.08);

	@include respond-to(mobile) {
		padding: 32px 0 20px;
	}

	.inner {
		max-width: 1080px;
		width: calc(100% - 24px);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		row-gap: 40px;

		@include respond-to(mobile) {
			row-gap: 28px;
		}
	}

	// ── CTA ──────────────────────────────────────────────────────

	.cta {
		@include color-success-bg(0.1);
		@include shadow;

		display: flex;
		align-items: center;
		justify-content: space-between;
		column-gap: 32px;
		padding: 36px 40px;
		border-radius: 12px;

		@include respond-to(mobile) {
			flex-direction: column;
			align-items: stretch;
			row-gap: 18px;
			padding: 22px 18px;
			border-radius: 10px;
			text-align: center;
		}

		.ctaBody {
			display: flex;
			flex-direction: column;
			row-gap: 10px;
			flex: 1 1 auto;
			min-width: 0;

			@include respond-to(mobile) {
				row-gap: 8px;
				align-items: center;
			}
		}

		.ctaTitle {
			@include reset;
			@include title-m;
			@include color-black;

			text-wrap: balance;

			@include respond-to(mobile) {
				@include title-s;
			}
		}

		.ctaText {
			@include reset;
			@include text-s;
			@include color-black(0.78);

			line-height: 1.55;
			max-width: 520px;
		}

		.ctaBtn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			column-gap: 10px;
			padding: 18px 32px;
			box-sizing: border-box;
			font-size: 16px;
			font-weight: 600;
			white-space: nowrap;
			border-radius: 12px;
			flex-shrink: 0;

			@include respond-to(mobile) {
				width: 100%;
				padding: 14px 20px;
				font-size: 15px;
				white-space: normal;
			}
		}

		.ctaBtnIcon {
			width: 24px;
			height: 24px;
		}
	}

	.eyebrow {
		@include text-xs;
		@include color-black(0.6);

		letter-spacing: 0.06em;
		text-transform: uppercase;
		font-weight: 600;
	}

	// ── Columns ───────────────────────────────────────────────────

	.cols {
		display: flex;
		column-gap: 40px;

		@include respond-to(mobile) {
			column-gap: 24px;
		}

		> * {
			flex: 1 1 0;
			min-width: 0;
		}
	}

	.brandRow {
		width: 100%;
	}

	.brandCol {
		display: flex;
		flex-direction: column;
		row-gap: 14px;

		.logo {
			max-width: 180px;

			@include respond-to(mobile) {
				max-width: 150px;
			}
		}

		.tagline {
			@include reset;
			@include text-s;
			@include color-black(0.7);

			line-height: 1.55;
			max-width: 320px;
		}
	}

	.navCol {
		display: flex;
		flex-direction: column;
		row-gap: 10px;

		@include respond-to(mobile) {
			row-gap: 12px;
		}

		.navLink {
			@include text-s;
			@include color-black(0.78);

			transition: color $transition-fast;

			&:hover {
				@include color-black;
			}

			@include respond-to(mobile) {
				padding: 4px 0;
			}
		}
	}

	.aboutCol {
		display: flex;
		flex-direction: column;
		row-gap: 12px;

		.aboutText {
			@include reset;
			@include text-s;
			@include color-black(0.7);

			line-height: 1.55;
			max-width: 320px;
		}

		.location {
			@include text-s;
			@include color-black(0.78);

			display: inline-flex;
			align-items: center;
			column-gap: 6px;
		}

		.locationIcon {
			width: 16px;
			height: 16px;
			flex-shrink: 0;
		}
	}

	.colTitle {
		@include title-xs;
		@include color-black;

		margin-bottom: 4px;
	}

	// ── Bottom bar ────────────────────────────────────────────────

	.bottom {
		@include text-xs;
		@include color-black(0.55);

		padding-top: 20px;
		border-top: 1px solid rgba($color-black-rgb, 0.08);

		@include respond-to(mobile) {
			text-align: center;
			padding-top: 16px;
		}
	}
}
</style>
