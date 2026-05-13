<script setup lang="ts">
const { $pwa } = useNuxtApp() as any;

const { showIosHint } = useInstallPrompt();
const { dismissed: iosHintDismissed, dismiss: dismissIosHint } =
	useIosInstallHint();
const showIosPlate = computed(
	() => showIosHint.value && !iosHintDismissed.value,
);
</script>

<template>
	<div>
		<NuxtLayout>
			<NuxtPage></NuxtPage>
		</NuxtLayout>

		<!-- ── PWA: обновление сервис-воркера ─────────────────────────── -->
		<div v-if="$pwa?.needRefresh" :class="$style.updatePlate">
			<span>Доступна новая версия приложения</span>
			<UiButton accent @click="$pwa.updateServiceWorker()">
				Обновить
			</UiButton>
		</div>

		<!-- ── PWA: подсказка для iOS ─────────────────────────────────── -->
		<div v-if="showIosPlate" :class="$style.iosHint">
			<Icon
				name="material-symbols:ios-share"
				:class="$style.iosIcon"
			/>
			<div :class="$style.iosBody">
				<span :class="$style.iosTitle">
					Установите приложение на главный экран
				</span>
				<span :class="$style.iosText">
					В Safari: «Поделиться»
					<Icon name="material-symbols:ios-share" />
					→ «На экран „Домой"».
				</span>
				<UiButton @click="dismissIosHint">Понятно</UiButton>
			</div>
		</div>
	</div>
</template>

<style lang="scss">
body {
	@include color-white-bg;
	@include color-black;

	margin: 0;
	padding: 0;
}

a {
	text-decoration: none;
}

.div {
	box-sizing: border-box;
}
</style>

<style module lang="scss">
.updatePlate {
	@include color-accent-bg;
	@include shadow;

	position: fixed;
	bottom: 16px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 9999;
	padding: 10px 14px;
	border-radius: 12px;
	display: flex;
	align-items: center;
	column-gap: 12px;
	backdrop-filter: blur(8px);
	max-width: calc(100vw - 24px);

	@include respond-to(mobile) {
		flex-direction: column;
		row-gap: 8px;
		text-align: center;
	}
}

.iosHint {
	@include color-white-bg(0.95);
	@include shadow;

	position: fixed;
	bottom: 16px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 9998;
	padding: 14px 16px;
	border-radius: 12px;
	display: flex;
	align-items: flex-start;
	column-gap: 12px;
	backdrop-filter: blur(8px);
	max-width: calc(100vw - 24px);
	width: 360px;
	box-sizing: border-box;
}

.iosIcon {
	@include color-accent;

	width: 28px;
	height: 28px;
	flex-shrink: 0;
	margin-top: 2px;
}

.iosBody {
	display: flex;
	flex-direction: column;
	row-gap: 8px;
	min-width: 0;
}

.iosTitle {
	@include text-m;
	@include color-black;

	font-weight: 600;
}

.iosText {
	@include text-s;
	@include color-black(0.7);

	line-height: 1.4;
}
</style>
