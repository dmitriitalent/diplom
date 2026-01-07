<script lang="ts" setup>
definePageMeta({
	layout: "welcome",
});
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.container">
			<div :class="$style.left">
				<UiLogo></UiLogo>
			</div>

			<div :class="$style.right">
				<UiAppear :delay="200">
					<h1 :class="$style.title">Мы предлагаем</h1>
				</UiAppear>

				<div :class="$style.grid">
					<UiAppear :delay="300">
						<div :class="$style.elem">
							<h2 :class="$style.subtitle">Клиентура</h2>
							<p :class="$style.content">
								Выпечка, репетиторство, печать или другие услуги
								— платформа помогает находить клиентов среди
								студентов вуза и резидентов общежития без лишних
								посредников.
							</p>
						</div>
					</UiAppear>
					<UiAppear :delay="400">
						<div :class="$style.elem">
							<h2 :class="$style.subtitle">Торговая площадка</h2>
							<p :class="$style.content">
								Иногда вещи перестают быть нужными, и наступает
								момент отпустить их. На этой платформе можно
								продать, обменять или отдать одежду и технику,
								подарив им вторую жизнь.
							</p>
						</div>
					</UiAppear>
					<UiAppear :delay="500">
						<div :class="$style.elem">
							<h2 :class="$style.subtitle">
								Расписание для резидентов
							</h2>
							<p :class="$style.content">
								Актуальное расписание работы общежития, душевых
								и стиральных машин. Уведомления подскажут, когда
								стирка завершится.
							</p>
						</div>
					</UiAppear>
					<UiAppear :delay="600">
						<div :class="$style.elem">
							<h2 :class="$style.subtitle">Мероприятия</h2>
							<p :class="$style.content">
								Настольные игры, спонтанные встречи или ночные
								прогулки — платформа помогает находить компанию
								и проводить время вместе.
							</p>
						</div>
					</UiAppear>
				</div>

				<UiAppear :delay="700">
					<RouterLink to="/registration">
						<UiButton>Присоединиться</UiButton>
					</RouterLink>
				</UiAppear>
			</div>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;

		position: absolute;
		top: 50%;
		transform: translate(0, -50%);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.left {
		@include color-white-bg;

		box-shadow: 0 0 40px 60px $color-white;
		border-radius: 100%;
	}

	.right {
		display: flex;
		flex-direction: column;
		row-gap: 50px;
		align-items: center;
	}

	.title {
		@include reset;
		@include title-l;
		@include color-white-bg;

		box-shadow: 0 0 40px 60px $color-white;
		border-radius: 100%;
	}

	.grid {
		border-radius: 100%;

		display: flex;
		flex-wrap: wrap;
		width: 900px;
		row-gap: 30px;
		column-gap: 30px;

		.elem {
			@include shadow;
			@include color-white-bg(0.6);

			display: flex;
			flex-direction: column;
			align-items: center;
			border-radius: 10px;
			padding: 10px 30px 30px 30px;
			width: 435px;
			box-sizing: border-box;

			.subtitle {
				@include title-s;
			}

			.content {
				@include reset;
				@include text-m;

				text-align: justify;
				text-indent: 1em;
			}
		}
	}

	:global(.uiButton__wrapper) {
		@include text-l;
		@include color-accent-bg;

		padding: 14px 36px;
	}
}
</style>
