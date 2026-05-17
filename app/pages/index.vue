<script lang="ts" setup>
import { useDevice } from "~/composables/device";
import { useAuthStore } from "~/stores/authStore";

definePageMeta({
	layout: "welcome",
});

useSeoMeta({
	title: "",
	description:
		"Hostelite — вся инфраструктура общежития в одном месте: соседи, расписания, услуги, объявления, чаты и расписания служб.",
	ogTitle: "Hostelite — инфраструктура общежития в одном месте",
	ogDescription:
		"Соседи, расписания, услуги, объявления и чаты — собранные вместе для одного общежития.",
});

// ─── Auth redirect ────────────────────────────────────────────────────────────
// Используем auth.refresh() из store — он обновляет токен в Pinia,
// поэтому global middleware не будет делать повторный рефреш при переходе.
// const auth = useAuthStore();
// if (!auth.isAuthenticated) {
// 	try {
// 		await auth.refresh();
// 	} catch {
// 		// Нет действительных токенов — остаёмся на лендинге
// 	}
// }
// if (auth.isAuthenticated) {
// 	await navigateTo("/profile/self", { replace: true });
// }

const { deviceClassList, isDevice } = useDevice();
const { isDark, toggle: toggleTheme } = useTheme();
const { enabled: shaderEnabled, toggle: toggleShader } = useShader();
const { showInstallButton, install } = useInstallPrompt();

const cards = [
	{
		title: "Активности",
		icon: "mdi:dice-multiple-outline",
		text: "Настолки, кино-вечера, прогулки. Каждый день собираются соседи, чтобы отдохнуть и весело провести время.",
		tag: "12 событий на неделе",
	},
	{
		title: "Каталог",
		icon: "mdi:tag-multiple-outline",
		text: "Ненужные мелочи, вещи, которые жалко выбросить или что-то, что может пригодиться другим — выкладывайте сюда.",
		tag: "84 объявления",
	},
	{
		title: "Услуги",
		icon: "mdi:tools",
		text: "Умеете печатать, готовить, чинить технику или хорошо объяснять? Разместите услугу и найдите клиентов.",
		tag: "27 мастеров",
	},
	{
		title: "Чаты",
		icon: "mdi:forum-outline",
		text: "Только заселились или никого не знаете? В чатах вы найдёте соседей с вашего этажа и нужные контакты.",
		tag: "по этажам и темам",
	},
	{
		title: "Расписание",
		icon: "mdi:clock-time-eight-outline",
		text: "Графики работы душевых, комендатуры и прачечной — всё собрано в одном месте, всегда под рукой.",
		tag: "8 служб",
	},
	{
		title: "Уведомления",
		icon: "mdi:bell-outline",
		text: "Завершение стирки, обновление документов, обход охраны — мы напомним о каждом важном событии.",
		tag: "push + e-mail",
	},
];

const stats = [
	{ k: "1", v: "общежитие" },
	{ k: "300", v: "жителей" },
	{ k: "1", v: "ВУЗ" },
	{ k: "24/7", v: "поддержка" },
];
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.inner">
			<!-- ── HERO ──────────────────────────────────────────────── -->
			<section :class="$style.hero">
				<UiAppear :delay="0">
					<div :class="$style.chip">
						<span :class="$style.dot"></span>
						beta · открыто для проживающих Икара
					</div>
				</UiAppear>

				<UiAppear :delay="300">
					<div :class="$style.titleBox">
						<h1 :class="$style.heroTitle">
							Вся инфраструктура общежития в одном месте
						</h1>
					</div>
				</UiAppear>

				<UiAppear :delay="700">
					<p :class="$style.lead">
						Соседи, расписания, услуги, объявления и чаты —
						собранные вместе для одного общежития. Без чужих, без
						рекламы, без лишнего.
					</p>
				</UiAppear>

				<UiAppear :delay="1100">
					<div :class="$style.heroActions">
						<RouterLink to="/registration">
							<UiButton accent size="large">
								Зарегистрироваться
							</UiButton>
						</RouterLink>
						<RouterLink to="/login">
							<UiButton :class="$style.loginBtn" size="large">
								У меня уже есть аккаунт
							</UiButton>
						</RouterLink>
					</div>
				</UiAppear>

				<UiAppear :delay="1300">
					<div :class="$style.iconActions">
						<UiButton
							v-if="showInstallButton"
							:class="$style.iconBtn"
							inset
							title="Установить приложение"
							@click="install"
						>
							<Icon
								name="material-symbols:install-mobile-rounded"
								:class="$style.iconBtnIcon"
							/>
						</UiButton>
						<UiButton
							:class="$style.iconBtn"
							inset
							:title="isDark ? 'Светлая тема' : 'Тёмная тема'"
							@click="toggleTheme"
						>
							<Icon
								v-if="isDark"
								name="material-symbols:wb-sunny-rounded"
								:class="$style.iconBtnIcon"
							/>
							<Icon
								v-else
								name="material-symbols:dark-mode-rounded"
								:class="$style.iconBtnIcon"
							/>
						</UiButton>
						<UiButton
							:class="$style.iconBtn"
							inset
							:title="
								shaderEnabled
									? 'Выключить фоновый шейдер'
									: 'Включить фоновый шейдер'
							"
							@click="toggleShader"
						>
							<Icon
								v-if="shaderEnabled"
								name="material-symbols:blur-on"
								:class="$style.iconBtnIcon"
							/>
							<Icon
								v-else
								name="material-symbols:blur-off"
								:class="$style.iconBtnIcon"
							/>
						</UiButton>
					</div>
				</UiAppear>

				<UiAppear :delay="1500">
					<div :class="$style.stats">
						<div v-for="s in stats" :key="s.v" :class="$style.stat">
							<div :class="$style.statK">{{ s.k }}</div>
							<div :class="$style.statV">{{ s.v }}</div>
						</div>
					</div>
				</UiAppear>
			</section>

			<!-- ── Section header ────────────────────────────────────── -->
			<div :class="$style.sectionHeader">
				<UiAppear :delay="2000">
					<div :class="$style.sectionTitleBox">
						<h2 :class="$style.sectionTitle">Что внутри</h2>
					</div>
				</UiAppear>
				<UiAppear :delay="2300">
					<div :class="$style.chip">6 разделов · всё бесплатно</div>
				</UiAppear>
			</div>

			<!-- ── Cards grid ────────────────────────────────────────── -->
			<div :class="$style.cardsGrid">
				<UiAppear
					v-for="(c, i) in cards"
					:key="c.title"
					:delay="2600 + i * 280"
				>
					<div :class="$style.card">
						<div :class="$style.cardHeader">
							<div :class="$style.cardIconBox">
								<Icon :name="c.icon" :class="$style.cardIcon" />
							</div>
							<h3 :class="$style.cardTitle">{{ c.title }}</h3>
						</div>
						<p :class="$style.cardText">{{ c.text }}</p>
					</div>
				</UiAppear>
			</div>

			<!-- ── Two-column callout ───────────────────────────────── -->
			<div :class="$style.callout">
				<UiAppear :delay="4500">
					<div :class="[$style.calloutCard, $style.calloutAccent]">
						<div :class="$style.calloutEyebrow">для коменданта</div>
						<h3 :class="$style.calloutTitle">
							Один канал связи со всем общежитием
						</h3>
						<p :class="$style.calloutText">
							Объявления, расписание и обходы — всё попадает в
							ленту и доходит до каждого. Без бумажек на двери.
						</p>
					</div>
				</UiAppear>

				<UiAppear :delay="4800">
					<div :class="$style.calloutCard">
						<div :class="$style.calloutEyebrow">отзыв</div>
						<p :class="$style.quote">
							«Перестали теряться объявления — наконец-то знаю,
							когда отключат воду.»
						</p>
						<div :class="$style.author">
							<div :class="$style.avatar">
								<Icon
									name="material-symbols:account-circle-full"
									:class="$style.avatarIcon"
								/>
							</div>
							<div>
								<div :class="$style.authorName">Дмитрий Г.</div>
								<div :class="$style.authorMeta">
									ИКАР · ул. Дубосековская 13
								</div>
							</div>
						</div>
					</div>
				</UiAppear>
			</div>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	width: 100%;
	min-height: calc(100dvh - 50px);
	overflow-y: auto;

	.inner {
		max-width: 1080px;
		width: calc(100% - 24px);
		margin: 0 auto;
		padding-bottom: 80px;

		@include respond-to(mobile) {
			padding-bottom: 40px;
		}
	}

	// ── Chip & dot ────────────────────────────────────────────────

	.chip {
		@include text-xs;
		@include color-black;
		@include color-white-bg(0.72);
		@include shadow;

		backdrop-filter: blur(12px);

		display: inline-flex;
		align-items: center;
		column-gap: 8px;
		padding: 5px 12px;
		border-radius: 100px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		width: fit-content;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #67a352;
		display: inline-block;
	}

	// ── Hero ──────────────────────────────────────────────────────

	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		row-gap: 28px;
		padding: 60px 0 40px;

		@include respond-to(mobile) {
			padding: 40px 0 24px;
			row-gap: 20px;
		}

		.titleBox {
			@include color-white-bg(0.72);
			@include shadow;

			backdrop-filter: blur(12px);

			padding: 10px 20px;
			border-radius: 16px;
		}

		.heroTitle {
			@include reset;
			@include title-l;
			@include color-black;
			@include unselectable;

			text-align: center;
			max-width: 820px;
			text-wrap: balance;

			@include respond-to(mobile) {
				@include title-m;
			}
		}

		.lead {
			@include reset;
			@include text-s;
			@include color-black;
			@include color-white-bg(0.72);
			@include shadow;

			backdrop-filter: blur(12px);

			max-width: 580px;
			text-align: center;
			padding: 10px 18px;
			border-radius: 12px;
			line-height: 1.55;
		}

		.heroActions {
			display: flex;
			column-gap: 12px;
			align-items: center;

			.loginBtn {
				@include color-white-bg(0.72);
				@include shadow;
				backdrop-filter: blur(12px);
			}

			@include respond-to(mobile) {
				flex-direction: column;
				row-gap: 10px;
				width: 100%;
			}
		}

		.iconActions {
			display: flex;
			column-gap: 12px;
			align-items: center;
			justify-content: center;

			.iconBtn {
				@include color-white-bg(0.72);
				@include shadow;

				display: flex;
				align-items: center;
				justify-content: center;
				width: 44px;
				height: 44px;
				padding: 0;
				border-radius: 12px;
				backdrop-filter: blur(12px);

				.iconBtnIcon {
					@include color-black;

					width: 22px;
					height: 22px;
				}
			}
		}

		.stats {
			@include color-white-bg(0.72);
			@include shadow;

			backdrop-filter: blur(12px);

			display: flex;
			column-gap: 36px;
			margin-top: 14px;
			padding: 14px 28px;
			border-radius: 100px;

			@include respond-to(mobile) {
				column-gap: 18px;
				padding: 12px 20px;
				border-radius: 16px;
				flex-wrap: wrap;
				row-gap: 12px;
				justify-content: center;
			}

			.stat {
				display: flex;
				flex-direction: column;
				align-items: center;
				min-width: 72px;
			}

			.statK {
				@include reset;
				@include color-black;

				font-family: "Poiret One";
				font-weight: 600;
				font-size: 26px;
				line-height: 1;
			}

			.statV {
				@include text-xs;
				@include color-black(0.6);

				margin-top: 4px;
				letter-spacing: 0.04em;
				text-transform: uppercase;
			}
		}
	}

	// ── Section header "Что внутри" ───────────────────────────────

	.sectionHeader {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 0 16px;
		column-gap: 12px;

		@include respond-to(mobile) {
			flex-direction: column;
			align-items: flex-start;
			row-gap: 8px;
		}

		.sectionTitleBox {
			@include color-white-bg(0.72);
			@include shadow;

			backdrop-filter: blur(12px);

			padding: 6px 14px;
			border-radius: 10px;
		}

		.sectionTitle {
			@include reset;
			@include title-s;
			@include color-black;
		}
	}

	// ── Cards grid ────────────────────────────────────────────────

	.cardsGrid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		column-gap: 20px;
		row-gap: 20px;
		padding-bottom: 60px;

		@include respond-to(mobile) {
			grid-template-columns: 1fr;
			column-gap: 0;
			row-gap: 12px;
			padding-bottom: 30px;
		}

		.card {
			@include color-white-bg(0.72);
			@include shadow;

			backdrop-filter: blur(12px);

			position: relative;
			padding: 22px;
			border-radius: 12px;
			display: flex;
			flex-direction: column;
			box-sizing: border-box;
			height: 100%;

			.cardHeader {
				display: flex;
				align-items: center;
				column-gap: 12px;
				margin-bottom: 12px;
			}

			.cardIconBox {
				@include color-accent-bg;

				width: 36px;
				height: 36px;
				border-radius: 8px;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
			}

			.cardIcon {
				@include color-black;

				width: 20px;
				height: 20px;
			}

			.cardTitle {
				@include reset;
				@include title-s;
				@include color-black;
			}

			.cardText {
				@include reset;
				@include text-s;
				@include color-black(0.78);

				line-height: 1.55;
			}

			.cardFoot {
				margin-top: auto;
				padding-top: 14px;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}

			.cardTag {
				@include text-xs;
				@include color-black(0.65);
				@include color-black-bg(0.06);

				padding: 2px 8px;
				border-radius: 100px;
				letter-spacing: 0.04em;
				text-transform: uppercase;
			}

			.cardArrow {
				@include color-black(0.5);

				width: 16px;
				height: 16px;
				flex-shrink: 0;
			}
		}
	}

	// ── Two-column callout ────────────────────────────────────────

	.callout {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		column-gap: 20px;

		@include respond-to(mobile) {
			grid-template-columns: 1fr;
			row-gap: 12px;
		}

		.calloutCard {
			@include color-white-bg(0.72);
			@include shadow;

			backdrop-filter: blur(12px);

			position: relative;
			padding: 28px;
			border-radius: 12px;
			box-sizing: border-box;

			@include respond-to(mobile) {
				padding: 22px;
			}
		}

		.calloutAccent {
			@include color-accent-bg(0.72);

			backdrop-filter: blur(12px);
		}

		.calloutEyebrow {
			@include text-xs;
			@include color-black(0.6);

			letter-spacing: 0.06em;
			text-transform: uppercase;
			margin-bottom: 10px;
		}

		.calloutTitle {
			@include reset;
			@include title-s;
			@include color-black;

			margin-bottom: 10px;
		}

		.calloutText {
			@include reset;
			@include text-s;
			@include color-black(0.78);

			line-height: 1.55;
			margin-bottom: 16px;
		}

		.quote {
			@include reset;
			@include color-black;

			font-family: "Poiret One";
			font-weight: 600;
			font-size: 20px;
			line-height: 1.35;
			margin-bottom: 14px;
		}

		.author {
			display: flex;
			align-items: center;
			column-gap: 10px;

			.avatar {
				@include color-accent-bg;

				width: 32px;
				height: 32px;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
			}

			.avatarIcon {
				@include color-black;

				width: 24px;
				height: 24px;
			}

			.authorName {
				@include text-s;
				@include color-black;

				font-weight: 500;
			}

			.authorMeta {
				@include text-xs;
				@include color-black(0.55);
			}
		}
	}
}
</style>
