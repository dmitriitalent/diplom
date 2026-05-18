<script setup lang="ts">
const props = defineProps({
	room: { type: Object, required: true },
	selfUserId: { type: String, required: true },
});

const emit = defineEmits<{
	(e: "send", msg: any): void;
}>();

const isHost = computed(() => props.room.hostId === props.selfUserId);
const state = computed(() => props.room.state);
const settings = computed(() => props.room.settings);

const myTarget = computed<string | null>(
	() => state.value.assignTargets?.[props.selfUserId] ?? null,
);
const myTargetPlayer = computed(() =>
	props.room.players.find((p: any) => p.userId === myTarget.value),
);

const myWordSubmitted = computed(() => {
	if (!myTarget.value) return false;
	return !!state.value.assignments?.[myTarget.value]?.word;
});

const wordDraft = ref("");

const submitWord = () => {
	const word = wordDraft.value.trim();
	if (!word) return;
	emit("send", { type: "papers-assign-word", word });
};

const generateClient = async () => {
	try {
		const data = await $fetch<{ word: string | null }>(
			"/api/games/pick-word",
			{
				query: {
					lang: settings.value.lang,
					dict: settings.value.dictionary,
				},
			},
		);
		if (data?.word) wordDraft.value = data.word;
	} catch {}
};

const otherPlayers = computed(() =>
	props.room.players.filter((p: any) => p.userId !== props.selfUserId),
);

const turnUserId = computed<string | null>(() => {
	if (state.value.phase !== "playing") return null;
	const q = state.value.turnQueue ?? [];
	const idx = state.value.currentTurnIdx ?? 0;
	return q[idx] ?? null;
});

const turnPlayer = computed(() =>
	props.room.players.find((p: any) => p.userId === turnUserId.value),
);

const isMyTurn = computed(() => turnUserId.value === props.selfUserId);

const isFinished = (uid: string) =>
	(state.value.finishedPlayers ?? []).includes(uid);

const openMenuFor = ref<string | null>(null);

const toggleMenu = (uid: string) => {
	openMenuFor.value = openMenuFor.value === uid ? null : uid;
};

const finishPlayer = (uid: string) => {
	emit("send", { type: "papers-finish-player", userId: uid });
	openMenuFor.value = null;
};

const newWord = (uid: string) => {
	emit("send", { type: "papers-new-word", userId: uid });
	openMenuFor.value = null;
};

const newGame = () => emit("send", { type: "new-game" });
</script>

<template>
	<div :class="$style.wrapper">
		<div v-if="state.phase === 'assigning'" :class="$style.assigning">
			<h2 :class="$style.title">Придумайте слово для:</h2>
			<div :class="$style.targetCard">
				<Icon
					name="mdi:account-circle-outline"
					:class="$style.targetIcon"
				/>
				<span>
					{{ myTargetPlayer?.name }} {{ myTargetPlayer?.surname }}
				</span>
			</div>

			<div v-if="!myWordSubmitted" :class="$style.input">
				<UiInput
					v-model="wordDraft"
					placeholder="Введите слово…"
				/>
				<div :class="$style.inputActions">
					<UiButton inset @click="generateClient">
						Сгенерировать
					</UiButton>
					<UiButton
						accent
						:disabled="!wordDraft.trim()"
						@click="submitWord"
					>
						Готово
					</UiButton>
				</div>
			</div>
			<p v-else :class="$style.hint">
				Вы уже отправили слово. Ждём остальных…
			</p>

			<div :class="$style.waiting">
				<h3 :class="$style.subtitle">Статус игроков</h3>
				<ul :class="$style.statusList">
					<li
						v-for="p in room.players"
						:key="p.userId"
						:class="$style.statusItem"
					>
						<Icon
							:name="
								state.assignments[
									state.assignTargets[p.userId]
								]
									? 'mdi:check-circle'
									: 'mdi:dots-horizontal-circle-outline'
							"
						/>
						<span>{{ p.name }} {{ p.surname }}</span>
					</li>
				</ul>
			</div>
		</div>

		<div v-else-if="state.phase === 'playing'" :class="$style.playing">
			<div :class="$style.turnBar">
				<span :class="$style.turnLabel">Сейчас ходит:</span>
				<span :class="$style.turnPlayer">
					{{ turnPlayer?.name }} {{ turnPlayer?.surname }}
				</span>
				<span v-if="isMyTurn" :class="$style.youBadge">Это вы!</span>
			</div>

			<div :class="$style.heads">
				<div
					v-for="p in otherPlayers"
					:key="p.userId"
					:class="[
						$style.head,
						isFinished(p.userId) && $style.headFinished,
						turnUserId === p.userId && $style.headTurn,
					]"
				>
					<div :class="$style.headName">
						{{ p.name }} {{ p.surname }}
					</div>
					<div :class="$style.headWord">
						<template v-if="isFinished(p.userId)">
							<span :class="$style.finishedTag">Закончил</span>
						</template>
						<template v-else>
							{{ state.assignments[p.userId]?.word ?? "…" }}
						</template>
					</div>
					<UiButton
						v-if="isHost && !isFinished(p.userId)"
						unset
						:class="$style.menuBtn"
						@click="toggleMenu(p.userId)"
					>
						<Icon name="mdi:dots-vertical" />
					</UiButton>
					<div
						v-if="openMenuFor === p.userId"
						:class="$style.menu"
					>
						<UiButton
							unset
							:class="$style.menuItem"
							@click="finishPlayer(p.userId)"
						>
							Окончить партию для игрока
						</UiButton>
						<UiButton
							unset
							:class="$style.menuItem"
							@click="newWord(p.userId)"
						>
							Сгенерировать новое слово
						</UiButton>
					</div>
				</div>
			</div>

			<div :class="$style.selfBlock">
				<div :class="$style.selfLabel">Ваше слово:</div>
				<div :class="$style.selfWord">скрыто</div>
				<p :class="$style.hint">
					Задавайте вопросы другим игрокам, чтобы угадать своё слово.
				</p>
			</div>
		</div>

		<div v-else-if="state.phase === 'finished'" :class="$style.finished">
			<h2 :class="$style.title">Игра окончена</h2>
			<p :class="$style.hint">Все игроки закончили партии.</p>
			<UiButton v-if="isHost" accent @click="newGame">
				Новая партия
			</UiButton>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	display: flex;
	flex-direction: column;
	row-gap: 24px;
}

.title {
	@include reset;
	@include title-l;
}

.subtitle {
	@include reset;
	@include title-s;
}

.hint {
	@include text-s;
	@include color-black;

	opacity: 0.6;
	margin: 0;
}

.assigning {
	@include color-white-bg(0.72);
	@include shadow;

	padding: 24px;
	border-radius: 14px;
	display: flex;
	flex-direction: column;
	row-gap: 16px;
}

.targetCard {
	@include color-warn-bg;

	display: flex;
	align-items: center;
	column-gap: 12px;
	padding: 14px 18px;
	border-radius: 10px;

	.targetIcon {
		width: 28px;
		height: 28px;
	}
}

.input {
	display: flex;
	flex-direction: column;
	row-gap: 8px;

	.inputActions {
		display: flex;
		column-gap: 10px;
		justify-content: flex-end;
	}
}

.waiting {
	margin-top: 10px;

	.statusList {
		@include reset;

		display: flex;
		flex-direction: column;
		row-gap: 4px;
	}

	.statusItem {
		display: flex;
		align-items: center;
		column-gap: 8px;
		@include text-s;
	}
}

.playing {
	display: flex;
	flex-direction: column;
	row-gap: 18px;
}

.turnBar {
	@include color-white-bg(0.72);
	@include shadow;

	display: flex;
	align-items: baseline;
	column-gap: 8px;
	padding: 10px 16px;
	border-radius: 10px;
	flex-wrap: wrap;

	.turnLabel {
		@include text-s;
		opacity: 0.6;
	}
	.turnPlayer {
		@include title-s;
	}
	.youBadge {
		@include text-s;
		@include color-warn-bg;

		padding: 2px 10px;
		border-radius: 100px;
	}
}

.heads {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 14px;
}

.head {
	@include color-white-bg(0.85);
	@include shadow;

	position: relative;
	padding: 16px;
	border-radius: 12px;
	display: flex;
	flex-direction: column;
	row-gap: 6px;
	border: 2px solid transparent;

	&.headTurn {
		border-color: rgba($color-warn-rgb, 0.7);
	}
	&.headFinished {
		opacity: 0.55;
	}

	.headName {
		@include text-s;
		opacity: 0.6;
	}
	.headWord {
		@include title-m;
		font-weight: 700;
	}
	.menuBtn {
		position: absolute;
		top: 6px;
		right: 6px;
		padding: 4px;
	}
	.menu {
		@include color-white-bg;
		@include shadow;

		position: absolute;
		top: 36px;
		right: 6px;
		border-radius: 10px;
		padding: 6px;
		z-index: 5;
		display: flex;
		flex-direction: column;
		min-width: 220px;
	}
	.menuItem {
		@include text-s;
		text-align: left;
		padding: 8px 10px;

		&:hover {
			@include color-black-bg(0.05);
		}
	}
	.finishedTag {
		@include color-success-bg;

		padding: 2px 10px;
		border-radius: 100px;
		font-size: 12px;
	}
}

.selfBlock {
	@include color-white-bg(0.72);
	@include shadow;

	padding: 18px;
	border-radius: 12px;
	text-align: center;
	display: flex;
	flex-direction: column;
	row-gap: 6px;

	.selfLabel {
		@include text-s;
		opacity: 0.6;
	}
	.selfWord {
		@include title-l;

		filter: blur(8px);
		user-select: none;
	}
}

.finished {
	@include color-white-bg(0.85);
	@include shadow;

	padding: 30px;
	border-radius: 14px;
	display: flex;
	flex-direction: column;
	align-items: center;
	row-gap: 20px;
}
</style>
