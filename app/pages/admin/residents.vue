<script setup lang="ts">
useSeoMeta({
	title: "Список проживающих — Hostelite",
	robots: "noindex, nofollow",
});

import { useDevice } from "~/composables/device";
import { useAuthStore } from "~/stores/authStore";
import type {
	ResidentsListDto,
	ResidentCardDto,
} from "~~/server/dto/admin/residentCard.dto";
import {
	pickContactForDM,
	pickContactForDMUrl,
	contactIcon,
	formatUserMention,
	type MentionFallbackParts,
} from "~/utils/contactUrl";

const { deviceClassList } = useDevice();
const auth = useAuthStore();

// ── Доступ ────────────────────────────────────────────────────────────────
if (!auth.isCommandant) {
	await navigateTo("/");
}

// ── Поиск ─────────────────────────────────────────────────────────────────

const searchQuery = ref("");
const residents = ref<ResidentCardDto[]>([]);
const loading = ref(false);
const error = ref("");
const lastQuery = ref("");

const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;

/**
 * Поиск разбирает строку как "Фамилия Имя Отчество" по пробелам.
 * Бэкенд использует ILIKE по каждой части, поэтому пустые части просто
 * не отправляются.
 */
const parseQuery = (q: string) => {
	const parts = q.trim().split(/\s+/).filter(Boolean);
	return {
		surname: parts[0] ?? "",
		name: parts[1] ?? "",
		patronymic: parts[2] ?? "",
	};
};

const runSearch = async () => {
	const trimmed = searchQuery.value.trim();
	if (trimmed === lastQuery.value && residents.value.length > 0) return;

	loading.value = true;
	error.value = "";
	try {
		const params = parseQuery(trimmed);
		const data = await $fetch<ResidentsListDto>("/api/admin/residents", {
			query: params,
			headers,
		});
		residents.value = data.items ?? [];
		lastQuery.value = trimmed;
	} catch (err: any) {
		error.value =
			err?.data?.message ??
			err?.message ??
			"Не удалось загрузить список проживающих";
		residents.value = [];
	} finally {
		loading.value = false;
	}
};

// Первичная загрузка — без фильтра, чтобы получить всех VERIFIED_RESIDENT.
await runSearch();

// ── Выделение ────────────────────────────────────────────────────────────

const selectedIds = ref<Set<string>>(new Set());

const isSelected = (id: string) => selectedIds.value.has(id);

const toggleSelected = (id: string) => {
	const next = new Set(selectedIds.value);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	selectedIds.value = next;
};

const selectAllVisible = () => {
	const next = new Set(selectedIds.value);
	for (const r of residents.value) next.add(r.id);
	selectedIds.value = next;
};

const clearSelection = () => {
	selectedIds.value = new Set();
};

const selectedResidents = computed(() =>
	residents.value.filter((r) => selectedIds.value.has(r.id)),
);

// ── Точечное сообщение (одному пользователю) ─────────────────────────────

const onDmClick = (r: ResidentCardDto) => {
	const url = pickContactForDMUrl(r.contacts);
	if (url) {
		window.open(url, "_blank", "noopener");
	}
};

const dmContactKey = (r: ResidentCardDto): string => {
	const c = pickContactForDM(r.contacts);
	return c?.key ?? "";
};

const hasDmContact = (r: ResidentCardDto): boolean => {
	return pickContactForDMUrl(r.contacts) !== null;
};

// ── Генератор сообщения (массовая рассылка) ──────────────────────────────

const messageBody = ref("");
const fallbackParts = reactive<MentionFallbackParts>({
	surname: true,
	name: true,
	patronymic: false,
});

const generatedMentions = computed(() => {
	if (selectedResidents.value.length === 0) return "";
	return selectedResidents.value
		.map((r) =>
			formatUserMention(
				{
					surname: r.surname,
					name: r.name,
					patronymic: r.patronymic,
					contacts: r.contacts,
				},
				fallbackParts,
			),
		)
		.filter((s) => s.length > 0)
		.join(" ");
});

const generatedMessage = computed(() => {
	const mentions = generatedMentions.value;
	const body = messageBody.value.trim();
	if (!mentions) return body;
	if (!body) return mentions;
	return `${mentions}\n\n${body}`;
});

const copyStatus = ref<"idle" | "ok" | "err">("idle");
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const onCopyMessage = async () => {
	if (!generatedMessage.value) return;
	try {
		await navigator.clipboard.writeText(generatedMessage.value);
		copyStatus.value = "ok";
	} catch {
		copyStatus.value = "err";
	}
	if (copyTimer) clearTimeout(copyTimer);
	copyTimer = setTimeout(() => {
		copyStatus.value = "idle";
	}, 2500);
};

onBeforeUnmount(() => {
	if (copyTimer) clearTimeout(copyTimer);
});
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<header :class="$style.head">
				<h1 :class="$style.pageTitle">Проживающие</h1>
				<p :class="$style.hint">
					Только пользователи с ролью
					<code>VERIFIED_RESIDENT</code>. Поиск по ФИО (через пробел):
					Фамилия, Имя, Отчество.
				</p>
			</header>

			<!-- ── Поиск ──────────────────────────────────────────────── -->
			<form
				:class="$style.searchBar"
				@submit.prevent="runSearch"
			>
				<UiInput
					v-model="searchQuery"
					placeholder="Иванов Иван Иванович"
					left-icon-name="mdi:account-search-outline"
					:class="$style.searchInput"
				/>
				<UiButton
					accent
					type="submit"
					:disabled="loading"
					:class="$style.searchBtn"
				>
					{{ loading ? "Поиск..." : "Найти" }}
				</UiButton>
			</form>

			<!-- ── Ошибка ─────────────────────────────────────────────── -->
			<div v-if="error" :class="$style.error">
				<Icon name="mdi:alert-circle-outline" :class="$style.errorIcon" />
				{{ error }}
			</div>

			<!-- ── Список ─────────────────────────────────────────────── -->
			<div v-if="loading && residents.length === 0" :class="$style.muted">
				Загрузка…
			</div>

			<div
				v-else-if="!loading && residents.length === 0"
				:class="$style.empty"
			>
				<Icon
					name="mdi:account-search-outline"
					:class="$style.emptyIcon"
				/>
				<span>
					Ничего не найдено. Попробуйте уточнить фамилию или имя.
				</span>
			</div>

			<template v-else>
				<!-- Панель массового выделения -->
				<div :class="$style.selectionBar">
					<span :class="$style.counter">
						Выделено: <strong>{{ selectedIds.size }}</strong>
						из {{ residents.length }}
					</span>
					<div :class="$style.selectionActions">
						<UiButton inset @click="selectAllVisible">
							Выделить всех
						</UiButton>
						<UiButton
							inset
							:disabled="selectedIds.size === 0"
							@click="clearSelection"
						>
							Снять выделение
						</UiButton>
					</div>
				</div>

				<div :class="$style.list">
					<div
						v-for="r in residents"
						:key="r.id"
						:class="[$style.card, isSelected(r.id) && $style.cardSelected]"
					>
						<label :class="$style.checkboxLabel">
							<input
								type="checkbox"
								:checked="isSelected(r.id)"
								:class="$style.checkbox"
								@change="toggleSelected(r.id)"
							/>
							<span :class="$style.checkboxCustom">
								<Icon
									v-if="isSelected(r.id)"
									name="mdi:check"
									:class="$style.checkIcon"
								/>
							</span>
						</label>

						<RouterLink
							:to="`/profile/${r.id}`"
							:class="$style.avatarLink"
						>
							<UiImage
								:src="
									r.avatarId
										? `/api/images/byGuid?guid=${r.avatarId}`
										: ''
								"
							/>
						</RouterLink>

						<RouterLink
							:to="`/profile/${r.id}`"
							:class="$style.info"
						>
							<span :class="$style.name">
								{{ r.surname }} {{ r.name }} {{ r.patronymic }}
							</span>
							<span :class="$style.room">
								<Icon
									name="material-symbols:home-work-outline-rounded"
									:class="$style.roomIcon"
								/>
								<template v-if="r.building || r.floor || r.room">
									к. {{ r.building || "—" }}, эт. {{ r.floor || "—" }},
									ком. {{ r.room || "—" }}
								</template>
								<template v-else>
									Размещение не указано
								</template>
							</span>
						</RouterLink>

						<UiButton
							:class="[
								$style.dmBtn,
								!hasDmContact(r) && $style.dmBtnDisabled,
							]"
							:disabled="!hasDmContact(r)"
							:title="
								hasDmContact(r)
									? `Написать через ${dmContactKey(r)}`
									: 'Нет доступных контактов'
							"
							@click="onDmClick(r)"
						>
							<Icon
								:name="
									hasDmContact(r)
										? contactIcon(dmContactKey(r))
										: 'mdi:account-off-outline'
								"
								:class="$style.dmIcon"
							/>
							<span :class="$style.dmLabel">Написать</span>
						</UiButton>
					</div>
				</div>
			</template>

			<!-- ── Генератор массового сообщения ─────────────────────── -->
			<section v-if="selectedIds.size > 0" :class="$style.composer">
				<h2 :class="$style.composerTitle">
					Сообщение для выделенных ({{ selectedIds.size }})
				</h2>

				<div :class="$style.composerBody">
					<!-- Чекбоксы fallback ФИО -->
					<div :class="$style.fallbackOpts">
						<span :class="$style.fallbackLabel">
							Если у пользователя нет VK — подставлять:
						</span>
						<UiCheckbox
							v-model="fallbackParts.surname"
							name="Фамилия"
						/>
						<UiCheckbox v-model="fallbackParts.name" name="Имя" />
						<UiCheckbox
							v-model="fallbackParts.patronymic"
							name="Отчество"
						/>
					</div>

					<!-- Текст сообщения -->
					<UiTextarea
						v-model="messageBody"
						:rows="5"
						placeholder="Текст сообщения. Можно оставить пустым — будут только теги."
					/>

					<!-- Превью -->
					<div :class="$style.previewBlock">
						<span :class="$style.previewLabel">Итоговое сообщение:</span>
						<pre :class="$style.preview">{{ generatedMessage || "—" }}</pre>
					</div>

					<div :class="$style.composerActions">
						<UiButton
							accent
							:disabled="!generatedMessage"
							@click="onCopyMessage"
						>
							<Icon
								:name="
									copyStatus === 'ok'
										? 'mdi:check'
										: 'mdi:content-copy'
								"
								:class="$style.copyIcon"
							/>
							{{
								copyStatus === "ok"
									? "Скопировано"
									: copyStatus === "err"
										? "Ошибка копирования"
										: "Скопировать"
							}}
						</UiButton>
						<UiButton inset @click="clearSelection">
							Очистить выделение
						</UiButton>
					</div>
				</div>
			</section>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	min-height: 100dvh;

	.container {
		@include container;

		padding: 40px 0 100px;
		display: flex;
		flex-direction: column;
		row-gap: 24px;

		@include respond-to(mobile) {
			@include container(mobile);

			padding: 16px 0 60px;
			row-gap: 16px;
		}
	}

	.head {
		display: flex;
		flex-direction: column;
		row-gap: 8px;
	}

	.pageTitle {
		@include reset;
		@include title-l;
		@include color-black;

		@include respond-to(mobile) {
			@include title-m;
		}
	}

	.hint {
		@include reset;
		@include text-s;
		@include color-black(0.6);

		line-height: 1.5;

		code {
			@include color-accent;

			font-family: monospace;
			font-size: 0.95em;
		}
	}

	// ── Поиск ────────────────────────────────────────────────────────────

	.searchBar {
		display: flex;
		column-gap: 10px;
		align-items: stretch;

		@include respond-to(mobile) {
			flex-direction: column;
			row-gap: 10px;
		}

		.searchInput {
			flex: 1;
		}

		.searchBtn {
			min-width: 140px;
			flex-shrink: 0;

			@include respond-to(mobile) {
				width: 100%;
			}
		}
	}

	.error {
		@include text-s;
		@include color-error-bg;
		@include color-black;

		display: flex;
		align-items: center;
		column-gap: 8px;
		padding: 12px 16px;
		border-radius: 10px;

		.errorIcon {
			width: 18px;
			height: 18px;
			flex-shrink: 0;
		}
	}

	.muted {
		@include text-s;
		@include color-black(0.55);

		text-align: center;
		padding: 24px 0;
	}

	.empty {
		@include text-m;
		@include color-black(0.5);

		display: flex;
		flex-direction: column;
		align-items: center;
		row-gap: 10px;
		padding: 40px 16px;
		text-align: center;

		.emptyIcon {
			width: 48px;
			height: 48px;
			opacity: 0.4;
		}
	}

	// ── Панель выделения ────────────────────────────────────────────────

	.selectionBar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		column-gap: 12px;
		padding: 10px 14px;
		border-radius: 10px;

		@include color-white-bg(0.6);

		@include respond-to(mobile) {
			flex-direction: column;
			align-items: stretch;
			row-gap: 8px;
		}

		.counter {
			@include text-s;
			@include color-black;
		}

		.selectionActions {
			display: flex;
			column-gap: 8px;

			@include respond-to(mobile) {
				width: 100%;

				> * {
					flex: 1;
				}
			}
		}
	}

	// ── Список карточек ────────────────────────────────────────────────

	.list {
		display: flex;
		flex-direction: column;
		row-gap: 8px;
	}

	.card {
		display: flex;
		align-items: center;
		column-gap: 14px;
		padding: 12px 16px;
		border-radius: 12px;
		border: 1px solid transparent;
		transition: background-color $transition-fast, border-color $transition-fast;

		@include color-white-bg(0.55);

		&:hover {
			@include color-white-bg(0.75);
		}

		&.cardSelected {
			@include color-accent-bg(0.12);

			border-color: rgba($color-accent-rgb, 0.4);
		}

		@include respond-to(mobile) {
			padding: 10px 12px;
			column-gap: 10px;
			flex-wrap: wrap;
		}
	}

	.checkboxLabel {
		display: flex;
		align-items: center;
		cursor: pointer;
		flex-shrink: 0;

		.checkbox {
			display: none;
		}

		.checkboxCustom {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 22px;
			height: 22px;
			border-radius: 6px;
			border: 1.5px solid rgba($color-black-rgb, 0.3);
			background: rgba($color-white-rgb, 0.6);
			transition: background-color $transition-fast, border-color $transition-fast;
		}

		.checkbox:checked + .checkboxCustom {
			@include color-accent-bg;

			border-color: $color-accent;

			.checkIcon {
				color: $color-white;
			}
		}

		.checkIcon {
			width: 16px;
			height: 16px;
		}
	}

	.avatarLink {
		display: block;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;

		@include color-black-bg(0.08);

		@include respond-to(mobile) {
			width: 42px;
			height: 42px;
		}
	}

	.info {
		display: flex;
		flex-direction: column;
		row-gap: 4px;
		flex: 1;
		min-width: 0;
		text-decoration: none;

		.name {
			@include title-xs;
			@include color-black;

			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.room {
			@include text-s;
			@include color-black(0.6);

			display: flex;
			align-items: center;
			column-gap: 4px;

			.roomIcon {
				width: 14px;
				height: 14px;
				flex-shrink: 0;
			}
		}
	}

	.dmBtn {
		display: inline-flex;
		align-items: center;
		column-gap: 6px;
		flex-shrink: 0;

		&.dmBtnDisabled {
			opacity: 0.4;
			cursor: not-allowed;
		}

		.dmIcon {
			width: 18px;
			height: 18px;
		}

		.dmLabel {
			@include respond-to(mobile) {
				display: none;
			}
		}
	}

	// ── Композитор сообщения ──────────────────────────────────────────

	.composer {
		position: sticky;
		bottom: 16px;
		padding: 20px 22px;
		border-radius: 14px;

		@include color-white-bg(0.92);
		@include shadow;

		backdrop-filter: blur(12px);

		display: flex;
		flex-direction: column;
		row-gap: 14px;

		@include respond-to(mobile) {
			position: relative;
			bottom: auto;
			padding: 14px;
			row-gap: 10px;
		}

		.composerTitle {
			@include reset;
			@include title-s;
			@include color-black;

			@include respond-to(mobile) {
				@include title-xs;
			}
		}

		.composerBody {
			display: flex;
			flex-direction: column;
			row-gap: 12px;
		}

		.fallbackOpts {
			display: flex;
			align-items: center;
			column-gap: 14px;
			row-gap: 8px;
			flex-wrap: wrap;

			.fallbackLabel {
				@include text-s;
				@include color-black(0.65);
			}
		}

		.previewBlock {
			display: flex;
			flex-direction: column;
			row-gap: 6px;

			.previewLabel {
				@include text-s;
				@include color-black(0.55);
			}

			.preview {
				@include reset;
				@include text-s;
				@include color-black;

				white-space: pre-wrap;
				word-break: break-word;
				padding: 12px 14px;
				border-radius: 10px;
				background: rgba($color-black-rgb, 0.05);
				border: 1px dashed rgba($color-black-rgb, 0.15);
				min-height: 50px;
				font-family: inherit;
			}
		}

		.composerActions {
			display: flex;
			justify-content: flex-end;
			column-gap: 10px;

			@include respond-to(mobile) {
				flex-direction: column;
				row-gap: 8px;
			}

			.copyIcon {
				width: 16px;
				height: 16px;
				margin-right: 6px;
			}
		}
	}
}
</style>
