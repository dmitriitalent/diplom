<script setup lang="ts">
import type { PropType } from "vue";
import type {
	AliasSettings,
	DictEntry,
	DictsManifest,
	Lang,
	PapersSettings,
	Room,
} from "~/entities/GameRoom";

const props = defineProps({
	room: { type: Object as PropType<Room>, required: true },
	selfUserId: { type: String, required: true },
	manifest: {
		type: Object as PropType<DictsManifest>,
		default: () => ({ ru: [], en: [] }),
	},
});

const emit = defineEmits<{
	(
		e: "update-settings",
		settings: Partial<AliasSettings> | Partial<PapersSettings>,
	): void;
	(e: "start"): void;
	(e: "kick", userId: string): void;
	(e: "leave"): void;
}>();

const isHost = computed<boolean>(() => props.room.hostId === props.selfUserId);

const update = (
	patch: Partial<AliasSettings> | Partial<PapersSettings>,
): void => {
	emit("update-settings", patch);
};

const langOptions: Array<{ value: Lang; name: string }> = [
	{ value: "ru", name: "Русский" },
	{ value: "en", name: "English" },
];

const dictOptions = computed<Array<{ value: string; name: string }>>(() => {
	const list: DictEntry[] = props.manifest[props.room.settings.lang] ?? [];
	return list.map((d) => ({ value: d.id, name: d.name }));
});

const modeOptions: Array<{ value: "auto" | "manual"; name: string }> = [
	{ value: "auto", name: "Автогенерация слов" },
	{ value: "manual", name: "Игроки придумывают сами" },
];

const copyCode = (): void => {
	if (typeof navigator !== "undefined" && navigator.clipboard) {
		navigator.clipboard.writeText(props.room.code);
	}
};

const canStart = computed<boolean>(() => {
	if (props.room.game === "alias") {
		return (
			props.room.players.length >= 4 &&
			props.room.players.length % 2 === 0
		);
	}
	return props.room.players.length >= 3;
});

const aliasSettings = computed<AliasSettings | null>(() =>
	props.room.game === "alias" ? props.room.settings : null,
);

const papersSettings = computed<PapersSettings | null>(() =>
	props.room.game === "papers" ? props.room.settings : null,
);
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
					<Icon name="mdi:content-copy" :class="$style.copyIcon" />
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
						:name="p.online ? 'mdi:circle' : 'mdi:circle-outline'"
						:class="$style.dot"
					/>
					<span :class="$style.name"
						>{{ p.name }} {{ p.surname }}</span
					>
					<span
						v-if="p.userId === room.hostId"
						:class="$style.hostTag"
					>
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
					@update:model-value="
						(v: string | number) => update({ lang: v as Lang })
					"
				/>
			</div>

			<div :class="$style.row">
				<label :class="$style.label">Словарь</label>
				<UiSelect
					:model-value="room.settings.dictionary"
					:options="dictOptions"
					@update:model-value="
						(v: string | number) =>
							update({ dictionary: String(v) })
					"
				/>
			</div>

			<template v-if="aliasSettings">
				<div :class="$style.row">
					<label :class="$style.label">Время раунда, сек</label>
					<UiInput
						type="number"
						:model-value="String(aliasSettings.roundTime)"
						@update:model-value="
							(v: string | number) =>
								update({ roundTime: Number(v) || 60 })
						"
					/>
				</div>
				<div :class="$style.row">
					<label :class="$style.label">Очков до победы</label>
					<UiInput
						type="number"
						:model-value="String(aliasSettings.scoreToWin)"
						@update:model-value="
							(v: string | number) =>
								update({ scoreToWin: Number(v) || 30 })
						"
					/>
				</div>
				<div :class="$style.row">
					<label :class="$style.label">Штраф за пропуск</label>
					<UiCheckbox
						:model-value="aliasSettings.skipPenalty"
						@update:model-value="
							(v: boolean) => update({ skipPenalty: v })
						"
					/>
				</div>
			</template>

			<template v-if="papersSettings">
				<div :class="$style.row">
					<label :class="$style.label">Режим слов</label>
					<UiSelect
						:model-value="papersSettings.mode"
						:options="modeOptions"
						@update:model-value="
							(v: string | number) =>
								update({ mode: v as 'auto' | 'manual' })
						"
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

		<p
			v-if="isHost && !canStart && room.game === 'alias'"
			:class="$style.hint"
		>
			Нужно чётное количество игроков, минимум 4.
		</p>
		<p
			v-if="isHost && !canStart && room.game === 'papers'"
			:class="$style.hint"
		>
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

		.name {
			@include text-s;
			@include color-black;
		}

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
