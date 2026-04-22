<script lang="ts" setup>
definePageMeta({
	layout: "welcome",
});
</script>

<template>
	<div :class="$style.wrapper">
		<HeaderComponent welcome></HeaderComponent>
		<div :class="$style.container">
			<div :class="$style.join">
				<h1 :class="$style.title">
					Вся инфраструктура общежития в одном месте
				</h1>
				<RouterLink to="/registration">
					<UiButton accent size="large" :class="$style.button">
						Начать
					</UiButton>
				</RouterLink>
			</div>
		</div>

		<UiGallery
			:slides-per-view="3"
			:space-between="64"
			:autoplay="5000"
			:speed="1000"
			loop
			:class="$style.cards"
		>
			<template #slide1>
				<div :class="$style.card">
					<h2 :class="$style.title">Активности</h2>
					<p :class="$style.text">
						Если стало скучно — предложите сыграть в настольные
						игры. Каждый день студенты собираются вместе, чтобы
						отдохнуть и весело провести время.
					</p>
				</div>
			</template>

			<template #slide2>
				<div :class="$style.card">
					<h2 :class="$style.title">Каталог</h2>
					<p :class="$style.text">
						Не нужные мелочи, вещи, которые жалко выбросить, или
						что-то, что может пригодиться другим — выкладывайте в
						каталог. Здесь можно продать или просто отдать хорошим
						людям то, что пылится.
					</p>
				</div>
			</template>

			<template #slide3>
				<div :class="$style.card">
					<h2 :class="$style.title">Услуги</h2>
					<p :class="$style.text">
						Умеете печатать, готовить, чинить технику или хорошо
						объяснять материал? Разместите свои услуги — мы поможем
						вам найти клиентов и заработать на своём навыке.
					</p>
				</div>
			</template>

			<template #slide4>
				<div :class="$style.card">
					<h2 :class="$style.title">Чаты</h2>
					<p :class="$style.text">
						Только заселились или пока никого не знаете? В чатах вы
						найдёте соседей с вашего этажа, нужные контакты и
						сможете быстрее освоиться.
					</p>
				</div>
			</template>

			<template #slide5>
				<div :class="$style.card">
					<h2 :class="$style.title">Расписание</h2>
					<p :class="$style.text">
						Актуальные графики работы душевых, комендатуры и других
						служб — всё собрано в одном месте, всегда под рукой.
					</p>
				</div>
			</template>

			<template #slide6>
				<div :class="$style.card">
					<h2 :class="$style.title">Уведомления</h2>
					<p :class="$style.text">
						Мы напомним о завершении стирки, обновлении документов,
						обходе охраны и других важных событиях, чтобы вы ничего
						не пропустили.
					</p>
				</div>
			</template>
		</UiGallery>
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;
	}

	.join {
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 500px;
		row-gap: 64px;
		align-items: center;

		.title {
			@include reset;
			@include color-black;
			@include title-l;
			@include unselectable;
		}

		.button {
			@include text-l;

			width: 150px;
		}
	}

	.cards {
		@include unselectable;

		padding: 0px 64px;
		box-sizing: border-box;

		.card {
			position: relative;
			height: 120px;
			display: flex;
			flex-direction: column;
			row-gap: 16px;
			border-radius: 10px;
			overflow: hidden;
			padding: 48px;

			.title {
				@include reset;
				@include color-black;
				@include title-s;

				display: flex;
				z-index: 2;
			}
			.text {
				@include reset;
				@include color-black;
				@include text-m;

				display: flex;
				z-index: 2;
			}

			&:after {
				@include color-white-bg(0.5);

				content: "";
				position: absolute;
				left: 0;
				top: 0;
				z-index: 1;
				height: 100%;
				width: 100%;
				filter: blur(10px);
			}
		}
	}
}
</style>
