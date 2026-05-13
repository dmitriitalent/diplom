<script setup lang="ts">
import { useDevice } from "~/composables/device";
import { useAuthStore } from "~/stores/authStore";
import { storeToRefs } from "pinia";

defineProps({
	welcome: {
		type: Boolean,
		default: false,
	},
});

const { deviceClassList, isDevice } = useDevice();
const sidebarOpen = ref(false);

const auth = useAuthStore();
const { isAdmin, isVerified } = storeToRefs(auth);

const close = () => {
	sidebarOpen.value = false;
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.header">
			<div :class="$style.container">
				<UiLogo />

				<div
					v-if="!welcome && !isDevice('mobile')"
					:class="$style.links"
				>
					<RouterLink v-if="isVerified" to="/schedule">
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
					<RouterLink v-if="isVerified" to="/news">
						<UiButton :class="$style.link" inset>Новости</UiButton>
					</RouterLink>
					<RouterLink v-if="isAdmin" to="/admin">
						<UiButton :class="$style.link" inset>Админ</UiButton>
					</RouterLink>
				</div>

				<RouterLink
					v-if="!welcome && !isDevice('mobile')"
					to="/profile/self"
					:class="$style.profileLink"
				>
					<UiButton :class="$style.profile" inset>
						<Icon
							:class="$style.icon"
							name="material-symbols:account-circle-full"
						></Icon>
					</UiButton>
				</RouterLink>

				<div v-if="welcome && !isDevice('mobile')" :class="$style.sign">
					<RouterLink to="/registration">
						<UiButton :class="$style.profile" inset>
							Регистрация
						</UiButton>
					</RouterLink>
					<RouterLink to="/login">
						<UiButton :class="$style.profile" inset>
							Войти
						</UiButton>
					</RouterLink>
				</div>

				<UiButton
					v-if="isDevice('mobile')"
					:class="$style.burger"
					inset
					@click="sidebarOpen = true"
				>
					<Icon name="mdi:menu" :class="$style.burgerIcon" />
				</UiButton>
			</div>

			<div :class="$style.bg"></div>
		</div>
		<div :class="$style.margin"></div>

		<Teleport to="body">
			<Transition name="overlay-fade">
				<div
					v-if="sidebarOpen"
					:class="$style.overlay"
					@click="close"
				/>
			</Transition>

			<UiTransition name="fade-right">
				<div v-if="sidebarOpen" :class="$style.sidebar">
					<div :class="$style.sidebarTop">
						<UiLogo />
						<UiButton :class="$style.closeBtn" inset @click="close">
							<Icon name="mdi:close" :class="$style.closeIcon" />
						</UiButton>
					</div>

					<nav v-if="!welcome" :class="$style.sidebarLinks">
						<RouterLink v-if="isVerified" to="/schedule" @click="close">
							<UiButton :class="$style.sidebarLink" inset>
								Расписание
							</UiButton>
						</RouterLink>
						<RouterLink to="/activities" @click="close">
							<UiButton :class="$style.sidebarLink" inset>
								Афиша
							</UiButton>
						</RouterLink>
						<RouterLink to="/services" @click="close">
							<UiButton :class="$style.sidebarLink" inset>
								Услуги
							</UiButton>
						</RouterLink>
						<RouterLink to="/catalog" @click="close">
							<UiButton :class="$style.sidebarLink" inset>
								Каталог
							</UiButton>
						</RouterLink>
						<RouterLink v-if="isVerified" to="/news" @click="close">
							<UiButton :class="$style.sidebarLink" inset>
								Новости
							</UiButton>
						</RouterLink>
						<RouterLink v-if="isAdmin" to="/admin" @click="close">
							<UiButton :class="$style.sidebarLink" inset>
								Админ-панель
							</UiButton>
						</RouterLink>
					</nav>

					<nav v-if="welcome" :class="$style.sidebarLinks">
						<RouterLink to="/login" @click="close">
							<UiButton :class="$style.sidebarLink" inset>
								Войти
							</UiButton>
						</RouterLink>
						<RouterLink to="/registration" @click="close">
							<UiButton :class="$style.sidebarLink" inset>
								Регистрация
							</UiButton>
						</RouterLink>
					</nav>

					<RouterLink
						v-if="!welcome"
						to="/profile/self"
						:class="$style.sidebarProfile"
						@click="close"
					>
						<UiButton :class="$style.sidebarProfileBtn" inset>
							<Icon
								name="material-symbols:account-circle-full"
								:class="$style.sidebarProfileIcon"
							/>
							Профиль
						</UiButton>
					</RouterLink>
				</div>
			</UiTransition>
		</Teleport>
	</div>
</template>

<style lang="scss">
.overlay-fade-enter-active,
.overlay-fade-leave-active {
	transition: opacity $transition;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
	opacity: 0;
}
</style>

<style module lang="scss">
.wrapper {
	$height: 50px;

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
		z-index: $headerZIndex;

		.container {
			@include container;

			display: flex;
			align-items: center;
			justify-content: space-between;
			z-index: 2;

			@include respond-to(mobile) {
				@include container(mobile);
			}

			.links {
				display: flex;
				column-gap: 20px;

				.link {
					font-weight: 450;
				}

				@include respond-to(mobile) {
					display: none;
				}
			}

			.profileLink {
				@include respond-to(mobile) {
					display: none;
				}
			}

			.profile {
				.icon {
					height: 24px;
					width: 24px;
				}
			}

			.sign {
				display: flex;
				column-gap: 32px;
			}

			.burger {
				display: none;
				align-items: center;
				justify-content: center;

				.burgerIcon {
					width: 24px;
					height: 24px;
				}

				@include respond-to(mobile) {
					display: flex;
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

// ── Overlay (teleported to body) ──────────────────────────────────────────────

.overlay {
	@include modal-backdrop;

	position: fixed;
	inset: 0;
	z-index: $headerZIndex + 1;
}

// ── Sidebar (teleported to body) ──────────────────────────────────────────────

.sidebar {
	@include color-white-bg;
	@include shadow;

	position: fixed;
	top: 0;
	right: 0;
	height: 100%;
	width: min(320px, 85vw);
	z-index: $headerZIndex + 2;
	display: flex;
	flex-direction: column;
	padding: 16px;
	box-sizing: border-box;
	overflow-y: auto;

	.sidebarTop {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 16px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		margin-bottom: 8px;

		.closeBtn {
			.closeIcon {
				width: 22px;
				height: 22px;
			}
		}
	}

	.sidebarLinks {
		display: flex;
		flex-direction: column;
		flex: 1;

		a {
			width: 100%;
		}

		.sidebarLink {
			@include title-xs;

			width: 100%;
			justify-content: flex-start;
			padding: 14px 12px;
			font-weight: 500;
		}
	}

	.sidebarProfile {
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		padding-top: 12px;
		margin-top: 8px;

		.sidebarProfileBtn {
			@include title-xs;

			width: 100%;
			justify-content: flex-start;
			padding: 14px 12px;
			column-gap: 10px;

			.sidebarProfileIcon {
				width: 24px;
				height: 24px;
			}
		}
	}
}
</style>
