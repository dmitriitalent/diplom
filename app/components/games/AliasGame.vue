<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

const props = defineProps({
	room: { type: Object, required: true },
	selfUserId: { type: String, required: true },
});

const emit = defineEmits<{
	(e: "send", msg: any): void;
}>();

const isHost = computed(() => props.room.hostId === props.selfUserId);
const state = computed(() => props.room.state);
const turn = computed(
	() => state.value.turnQueue?.[state.value.currentTurnIdx],
);
const currentTeam = computed(() => state.value.teams?.[turn.value?.teamIdx]);
const speaker = computed(() =>
	props.room.players.find((p: any) => p.userId === turn.value?.speakerUserId),
);
const isSpeaker = computed(
	() => turn.value?.speakerUserId === props.selfUserId,
);

const now = ref(Date.now());
let interval: ReturnType<typeof setInterval> | null = null;

const startTicker = () => {
	if (interval) return;
	interval = setInterval(() => {
		now.value = Date.now();
	}, 250);
};

const stopTicker = () => {
	if (interval) {
		clearInterval(interval);
		interval = null;
	}
};

watchEffect(() => {
	if (state.value.phase === "round-active") startTicker();
	else stopTicker();
});

onBeforeUnmount(stopTicker);

const remaining = computed(() => {
	if (state.value.phase !== "round-active" || !state.value.roundEndsAt) {
		return 0;
	}
	return Math.max(0, Math.ceil((state.value.roundEndsAt - now.value) / 1000));
});

const endRoundSent = ref(false);

watchEffect(() => {
	if (state.value.phase !== "round-active") {
		endRoundSent.value = false;
		return;
	}
	if (remaining.value === 0 && isSpeaker.value && !endRoundSent.value) {
		endRoundSent.value = true;
		emit("send", { type: "alias-end-round" });
	}
});

const startTurn = () => emit("send", { type: "alias-start-turn" });
const guess = () => emit("send", { type: "alias-action", action: "guessed" });
const skip = () => emit("send", { type: "alias-action", action: "skipped" });
const newGame = () => emit("send", { type: "new-game" });
const nextTurn = () => emit("send", { type: "alias-next-turn" });
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.scoreboard">
			<div
				v-for="t in state.teams"
				:key="t.id"
				:class="[
					$style.team,
					turn?.teamIdx === t.id && $style.teamActive,
					state.winnerTeamIdx === t.id && $style.teamWinner,
				]"
			>
				<div :class="$style.teamName">{{ t.name }}</div>
				<div :class="$style.teamScore">{{ t.score }}</div>
				<div :class="$style.teamPlayers">
					<span
						v-for="pid in t.playerIds"
						:key="pid"
						:class="$style.teamPlayer"
					>
						{{
							room.players.find((p: any) => p.userId === pid)?.name
						}}
					</span>
				</div>
			</div>
		</div>

		<div v-if="state.phase === 'finished'" :class="$style.finished">
			<h2 :class="$style.title">
				Победила {{ state.teams[state.winnerTeamIdx]?.name }}!
			</h2>
			<UiButton v-if="isHost" accent @click="newGame">
				Новая партия
			</UiButton>
		</div>

		<template v-else>
			<div :class="$style.turnInfo">
				<span :class="$style.turnLabel">Объясняет:</span>
				<span :class="$style.turnSpeaker">
					{{ speaker?.name }} {{ speaker?.surname }}
				</span>
				<span :class="$style.turnTeam">
					({{ currentTeam?.name }})
				</span>
			</div>

			<div
				v-if="state.phase === 'round-pre'"
				:class="$style.center"
			>
				<p :class="$style.hint">
					Раунд {{ room.settings.roundTime }} секунд.
				</p>
				<UiButton
					v-if="isSpeaker"
					accent
					:class="$style.bigBtn"
					@click="startTurn"
				>
					Начать раунд
				</UiButton>
				<p v-else :class="$style.hint">
					Ждём {{ speaker?.name }}…
				</p>
			</div>

			<div
				v-if="state.phase === 'round-active'"
				:class="$style.center"
			>
				<div :class="$style.timer">{{ remaining }}</div>

				<div v-if="isSpeaker" :class="$style.wordCard">
					{{ state.currentWord }}
				</div>
				<p v-else :class="$style.hint">
					Слушайте объяснение и угадывайте.
				</p>

				<div v-if="isSpeaker" :class="$style.controls">
					<UiButton :class="$style.skipBtn" @click="skip">
						Пропустить
					</UiButton>
					<UiButton accent :class="$style.guessBtn" @click="guess">
						Угадано
					</UiButton>
				</div>
			</div>

			<div
				v-if="state.phase === 'round-result'"
				:class="$style.center"
			>
				<h3 :class="$style.subtitle">Итог раунда</h3>
				<ul :class="$style.entries">
					<li
						v-for="(e, i) in state.roundEntries"
						:key="i"
						:class="[
							$style.entry,
							e.status === 'skipped' && $style.entrySkipped,
						]"
					>
						<Icon
							:name="
								e.status === 'guessed'
									? 'mdi:check'
									: 'mdi:close'
							"
						/>
						<span>{{ e.word }}</span>
					</li>
				</ul>
				<UiButton v-if="isHost" accent @click="nextTurn">
					Следующий ход
				</UiButton>
				<p v-else :class="$style.hint">
					Хост готовит следующий ход…
				</p>
			</div>
		</template>
	</div>
</template>

<style module lang="scss">
.wrapper {
	display: flex;
	flex-direction: column;
	row-gap: 24px;
}

.scoreboard {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 14px;

	.team {
		@include color-white-bg(0.72);
		@include shadow;

		padding: 14px 16px;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		row-gap: 6px;
		border: 2px solid transparent;

		&.teamActive {
			border-color: rgba($color-warn-rgb, 0.7);
		}
		&.teamWinner {
			border-color: rgba($color-success-rgb, 0.7);
		}

		.teamName {
			@include text-s;
			@include color-black;

			opacity: 0.6;
		}
		.teamScore {
			@include title-l;
			@include color-black;

			font-weight: 700;
		}
		.teamPlayers {
			display: flex;
			flex-wrap: wrap;
			column-gap: 6px;
			row-gap: 3px;

			.teamPlayer {
				@include text-s;
				@include color-black;

				opacity: 0.7;
				font-size: 12px;
			}
		}
	}
}

.turnInfo {
	display: flex;
	column-gap: 8px;
	align-items: baseline;
	flex-wrap: wrap;

	.turnLabel {
		@include text-s;
		opacity: 0.6;
	}
	.turnSpeaker {
		@include text-m;
		font-weight: 600;
	}
	.turnTeam {
		@include text-s;
		opacity: 0.5;
	}
}

.center {
	@include color-white-bg(0.72);
	@include shadow;

	padding: 30px 24px;
	border-radius: 14px;
	display: flex;
	flex-direction: column;
	align-items: center;
	row-gap: 18px;
}

.title {
	@include reset;
	@include title-l;
}

.subtitle {
	@include reset;
	@include title-s;
}

.timer {
	@include title-l;

	font-size: 48px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}

.wordCard {
	@include color-warn-bg;
	@include title-l;

	padding: 30px 40px;
	border-radius: 14px;
	text-align: center;
	min-width: 260px;
}

.hint {
	@include text-s;
	@include color-black;

	opacity: 0.6;
	margin: 0;
	text-align: center;
}

.bigBtn {
	padding: 14px 28px;
	font-size: 18px;
}

.controls {
	display: flex;
	column-gap: 14px;

	.skipBtn {
		@include color-error-bg;

		padding: 12px 22px;
	}

	.guessBtn {
		padding: 12px 28px;
	}
}

.entries {
	@include reset;

	display: flex;
	flex-direction: column;
	row-gap: 4px;
	min-width: 240px;

	.entry {
		display: flex;
		align-items: center;
		column-gap: 8px;
		@include text-s;

		&.entrySkipped {
			opacity: 0.5;
		}
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
