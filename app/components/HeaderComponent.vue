<script setup lang="ts"></script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.header">
			<div :class="$style.container">
				<UiLogo />

				<div :class="$style.links">
					<RouterLink to="/schedule">
						<UiButton :class="$style.link" inset>
							Расписание
						</UiButton>
					</RouterLink>
					<RouterLink to="/activities">
						<UiButton :class="$style.link" inset>Афиша</UiButton>
					</RouterLink>
					<RouterLink to="/services">
						<UiButton :class="$style.link" inset>Услуги</UiButton>
					</RouterLink>
					<RouterLink to="/catalog">
						<UiButton :class="$style.link" inset>Каталог</UiButton>
					</RouterLink>
					<RouterLink to="/messenger">
						<UiButton :class="$style.link" inset>Чат</UiButton>
					</RouterLink>
				</div>

				<RouterLink to="/profile">
					<UiButton :class="$style.profile" inset>
						<Icon
							:class="$style.icon"
							name="material-symbols:account-circle-full"
						></Icon>
					</UiButton>
				</RouterLink>
			</div>

			<div :class="$style.bg"></div>
		</div>
		<div :class="$style.margin"></div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	$height: 70px;

	.margin {
		height: $height;
		width: 100%;
	}

	.header {
		@include shadow;

		position: fixed;
		height: $height;
		width: 100%;
		display: flex;
		align-items: center;

		.container {
			@include container;

			display: flex;
			align-items: center;
			justify-content: space-between;
			z-index: 2;

			.links {
				display: flex;
				column-gap: 20px;

				.link {
					font-weight: 450;
				}
			}

			.profile {
				.icon {
					height: 32px;
					width: 32px;
				}
			}
		}

		.bg {
			@include color-white-bg(0.5);

			position: absolute;
			left: 0;
			top: 0;
			z-index: 1;
			height: $height;
			width: 100%;
			backdrop-filter: blur(5px);
		}
	}
}
</style>
