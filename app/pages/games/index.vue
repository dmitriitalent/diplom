<script setup lang="ts">
definePageMeta({ middleware: "authenticated" });

useSeoMeta({
	title: "Игры",
	description: "Многопользовательские игры в Hostelite: Alias и Бумажки.",
});

import { useDevice } from "~/composables/device";

const { deviceClassList } = useDevice();
const router = useRouter();

type CreateResponse = { id: string; code: string };

const joinCode = ref("");
const creating = ref(false);
const joining = ref(false);
const error = ref<string | null>(null);

const create = async (game: "alias" | "papers"): Promise<void> => {
	creating.value = true;
	error.value = null;
	try {
		const res = await $fetch<CreateResponse>("/api/games/create", {
			method: "POST",
			body: { game },
		});
		router.push("/games/" + res.id);
	} catch (e) {
		const err = e as { data?: { message?: string }; message?: string };
		error.value = err.data?.message ?? err.message ?? "Ошибка создания";
	} finally {
		creating.value = false;
	}
};

const join = async (): Promise<void> => {
	const code = joinCode.value.trim().toUpperCase();
	if (code.length !== 8) {
		error.value = "Код должен содержать 8 символов";
		return;
	}
	joining.value = true;
	error.value = null;
	try {
		const res = await $fetch<CreateResponse>("/api/games/join", {
			method: "POST",
			body: { code },
		});
		router.push("/games/" + res.id);
	} catch (e) {
		const err = e as { data?: { message?: string }; message?: string };
		error.value = err.data?.message ?? err.message ?? "Ошибка подключения";
	} finally {
		joining.value = false;
	}
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<h1 :class="$style.title">Игры</h1>

			<div :class="$style.gamesRow">
				<div :class="$style.card">
					<Icon name="mdi:bullhorn-outline" :class="$style.cardIcon" />
					<h2 :class="$style.cardTitle">Alias</h2>
					<p :class="$style.cardDesc">
						Команды объясняют слова друг другу. Чем больше угадано,
						тем выше счёт.
					</p>
					<UiButton
						accent
						:disabled="creating"
						@click="create('alias')"
					>
						Создать комнату
					</UiButton>
				</div>

				<div :class="$style.card">
					<Icon
						name="mdi:sticker-emoji"
						:class="$style.cardIcon"
					/>
					<h2 :class="$style.cardTitle">Бумажки</h2>
					<p :class="$style.cardDesc">
						Каждому игроку «приклеено» слово. Угадайте своё, задавая
						вопросы.
					</p>
					<UiButton
						accent
						:disabled="creating"
						@click="create('papers')"
					>
						Создать комнату
					</UiButton>
				</div>
			</div>

			<div :class="$style.join">
				<h3 :class="$style.joinTitle">Подключиться по коду</h3>
				<div :class="$style.joinRow">
					<UiInput
						v-model="joinCode"
						:class="$style.joinInput"
						placeholder="XXXXXXXX"
					/>
					<UiButton inset :disabled="joining" @click="join">
						{{ joining ? "Подключение..." : "Войти" }}
					</UiButton>
				</div>
			</div>

			<p v-if="error" :class="$style.error">{{ error }}</p>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;

		display: flex;
		flex-direction: column;
		row-gap: 30px;

		@include respond-to(mobile) {
			@include container(mobile);
		}
	}

	.title {
		@include reset;
		@include title-l;
		@include color-black;
	}

	.gamesRow {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;

		@include respond-to(mobile) {
			grid-template-columns: 1fr;
		}
	}

	.card {
		@include color-white-bg(0.72);
		@include shadow;

		display: flex;
		flex-direction: column;
		align-items: flex-start;
		row-gap: 12px;
		padding: 24px;
		border-radius: 14px;

		.cardIcon {
			width: 40px;
			height: 40px;
			opacity: 0.7;
		}

		.cardTitle {
			@include reset;
			@include title-m;
			@include color-black;
		}

		.cardDesc {
			@include reset;
			@include text-s;
			@include color-black;

			opacity: 0.65;
		}
	}

	.join {
		@include color-white-bg(0.72);
		@include shadow;

		padding: 18px;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		row-gap: 10px;

		.joinTitle {
			@include reset;
			@include title-s;
			@include color-black;
		}

		.joinRow {
			display: flex;
			column-gap: 10px;

			.joinInput {
				flex: 1;
				text-transform: uppercase;
			}
		}
	}

	.error {
		@include text-s;
		@include color-error-bg;

		padding: 10px 14px;
		border-radius: 10px;
	}
}
</style>
