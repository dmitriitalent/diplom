<script setup lang="ts">
import type { PropType } from "vue";

const props = defineProps({
	room: { type: Object, required: true },
	selfUserId: { type: String, required: true },
	manifest: {
		type: Object as PropType<{
			ru: Array<{ id: string; name: string }>;
			en: Array<{ id: string; name: string }>;
		}>,
		default: () => ({ ru: [], en: [] }),
	},
});

const emit = defineEmits<{
	(e: "update-settings", settings: any): void;
	(e: "start"): void;
	(e: "kick", userId: string): void;
	(e: "leave"): void;
}>();

const isHost = computed(() => props.room.hostId === props.selfUserId);

const settings = computed({
	get: () => props.room.settings,
	set: (v) => emit("update-settings", v),
});

const update = (patch: any) => {
	emit("update-settings", { ...props.room.settings, ...patch });
};

const langOptions = [
	{ value: "ru", name: "Русский" },
	{ value: "en", name: "English" },
];

const dictOptions = computed(() => {
	const list = props.manifest[props.room.settings.lang as "ru" | "en"] ?? [];
	return list.map((d) => ({ value: d.id, name: d.name }));
});

const modeOptions = [
	{ value: "auto", name: "Автогенерация слов" },
	{ value: "manual", name: "Игроки придумывают сами" },
];

const copyCode = () => {
	if (typeof navigator !== "undefined" && navigator.clipboard) {
		navigator.clipboard.writeText(props.room.code);
	}
};

const canStart = computed(() => {
	if (props.room.game === "alias") {
		return (
			props.room.players.length >= 4 &&
			props.room.players.length % 2 === 0
		);
	}
	return props.room.players.length >= 3;
});
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.header">
			<h2 :class="$style.title">
				{{ room.game === "alias" ? "Alias" : "Бумажки" }}
			</h2>
			<div :class="$style.code">
				<span :class="$style.codeLabel">Код:</span>
				<span :class="$style.codeValue">{{ room.code }}</span>
				<UiButton unset :class="$style.copyBtn" @click="copyCode">
					<Icon
						name="mdi:content-copy"
						:class="$style.copyIcon"
					/>
				</UiButton>
			</div>
		</div>

		<div :class="$style.players">
			<h3 :class="$style.subtitle">Игроки ({{ room.players.length }})</h3>
			<ul :class="$style.playersList">
				<li
					v-for="p in room.players"
					:key="p.userId"
					:class="[$style.playerItem, !p.online && $style.offline]"
				>
					<Icon
						:name="
							p.online
								? 'mdi:circle'
								: 'mdi:circle-outline'
						"
						:class="$style.dot"
					/>
					<span>{{ p.name }} {{ p.surname }}</span>
					<span v-if="p.userId === room.hostId" :class="$style.hostTag">
						хост
					</span>
					<UiButton
						v-if="isHost && p.userId !== selfUserId"
						unset
						:class="$style.kickBtn"
						@click="emit('kick', p.userId)"
					>
						<Icon name="mdi:close" />
					</UiButton>
				</li>
			</ul>
		</div>

		<div :class="$style.settings">
			<h3 :class="$style.subtitle">Настройки</h3>

			<div :class="$style.row">
				<label :class="$style.label">Язык</label>
				<UiSelect
					:model-value="room.settings.lang"
					:options="langOptions"
					:disabled="!isHost"
					@update:model-value="(v) => update({ lang: v })"
				/>
			</div>

			<div :class="$style.row">
				<label :class="$style.label">Словарь</label>
				<UiSelect
					:model-value="room.settings.dictionary"
					:options="dictOptions"
					:disabled="!isHost"
					@update:model-value="(v) => update({ dictionary: v })"
				/>
			</div>

			<template v-if="room.game === 'alias'">
				<div :class="$style.row">
					<label :class="$style.label">Время раунда, сек</label>
					<UiInput
						type="number"
						:model-value="String(room.settings.roundTime)"
						:disabled="!isHost"
						@update:model-value="
							(v: any) => update({ roundTime: Number(v) || 60 })
						"
					/>
				</div>
				<div :class="$style.row">
					<label :class="$style.label">Очков до победы</label>
					<UiInput
						type="number"
						:model-value="String(room.settings.scoreToWin)"
						:disabled="!isHost"
						@update:model-value="
							(v: any) => update({ scoreToWin: Number(v) || 30 })
						"
					/>
				</div>
				<div :class="$style.row">
					<label :class="$style.label">Штраф за пропуск</label>
					<UiCheckbox
						:model-value="!!room.settings.skipPenalty"
						:disabled="!isHost"
						@update:model-value="
							(v) => update({ skipPenalty: !!v })
						"
					/>
				</div>
			</template>

			<template v-if="room.game === 'papers'">
				<div :class="$style.row">
					<label :class="$style.label">Режим слов</label>
					<UiSelect
						:model-value="room.settings.mode"
						:options="modeOptions"
						:disabled="!isHost"
						@update:model-value="(v) => update({ mode: v })"
					/>
				</div>
			</template>
		</div>

		<div :class="$style.actions">
			<UiButton inset @click="emit('leave')">Выйти</UiButton>
			<UiButton
				v-if="isHost"
				accent
				:disabled="!canStart"
				@click="emit('start')"
			>
				Начать игру
			</UiButton>
		</div>

		<p v-if="isHost && !canStart && room.game === 'alias'" :class="$style.hint">
			Нужно чётное количество игроков, минимум 4.
		</p>
		<p v-if="isHost && !canStart && room.game === 'papers'" :class="$style.hint">
			Нужно минимум 3 игрока.
		</p>
	</div>
</template>

<style module lang="scss">
.wrapper {
	display: flex;
	flex-direction: column;
	row-gap: 20px;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 14px;
	flex-wrap: wrap;
	row-gap: 10px;

	.title {
		@include reset;
		@include title-l;
		@include color-black;
	}

	.code {
		@include color-white-bg(0.72);
		@include shadow;

		display: flex;
		align-items: center;
		column-gap: 8px;
		padding: 6px 12px;
		border-radius: 8px;

		.codeLabel {
			@include text-s;
			@include color-black;

			opacity: 0.6;
		}

		.codeValue {
			@include text-m;
			@include color-black;

			font-family: monospace;
			letter-spacing: 2px;
			font-weight: 600;
		}

		.copyBtn {
			padding: 4px;

			.copyIcon {
				width: 16px;
				height: 16px;
				opacity: 0.6;
			}
		}
	}
}

.players,
.settings {
	@include color-white-bg(0.72);
	@include shadow;

	padding: 14px 18px;
	border-radius: 12px;
	display: flex;
	flex-direction: column;
	row-gap: 10px;
}

.subtitle {
	@include reset;
	@include title-s;
	@include color-black;
}

.playersList {
	@include reset;

	display: flex;
	flex-direction: column;
	row-gap: 6px;

	.playerItem {
		display: flex;
		align-items: center;
		column-gap: 8px;

		&.offline {
			opacity: 0.45;
		}

		.dot {
			width: 10px;
			height: 10px;
			color: #2ecc71;
		}

		.hostTag {
			@include text-s;
			@include color-warn-bg;

			padding: 1px 8px;
			border-radius: 100px;
			font-size: 11px;
		}

		.kickBtn {
			margin-left: auto;
			padding: 4px;
			opacity: 0.5;
		}
	}
}

.row {
	display: grid;
	grid-template-columns: 200px 1fr;
	align-items: center;
	gap: 10px;

	@include respond-to(mobile) {
		grid-template-columns: 1fr;
	}

	.label {
		@include text-s;
		@include color-black;

		opacity: 0.7;
	}
}

.actions {
	display: flex;
	column-gap: 10px;
	justify-content: flex-end;
}

.hint {
	@include text-s;
	@include color-black;

	opacity: 0.6;
	margin: 0;
}
</style>
