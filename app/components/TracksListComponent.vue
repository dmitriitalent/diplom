<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { TrackDto } from "~~/server/dto/activityMusic/list";

const props = defineProps<{
	activityId: string;
	canEdit: boolean;
	selfUserId: string;
}>();

const COLLAPSED = 5;

const tracks = ref<TrackDto[]>([]);
const expanded = ref(false);
const modalOpen = ref(false);
const submitting = ref(false);
const error = ref<string | null>(null);

const mode = ref<"link" | "manual">("link");
const form = ref({ title: "", author: "", link: "" });

const fetchList = async (): Promise<void> => {
	try {
		const res = await $fetch<{ tracks: TrackDto[] }>(
			"/api/activity-music/list",
			{ query: { id: props.activityId } },
		);
		tracks.value = res.tracks ?? [];
	} catch {
		tracks.value = [];
	}
};

onMounted(fetchList);

const visibleTracks = computed<TrackDto[]>(() =>
	expanded.value ? tracks.value : tracks.value.slice(0, COLLAPSED),
);

const hasMore = computed<boolean>(() => tracks.value.length > COLLAPSED);

const openModal = (): void => {
	form.value = { title: "", author: "", link: "" };
	mode.value = "link";
	error.value = null;
	modalOpen.value = true;
};

const closeModal = (): void => {
	modalOpen.value = false;
};

const submit = async (): Promise<void> => {
	error.value = null;
	const payload =
		mode.value === "link"
			? { link: form.value.link.trim() }
			: {
					title: form.value.title.trim(),
					author: form.value.author.trim(),
				};

	if (mode.value === "link" && !payload.link) {
		error.value = "Введите ссылку";
		return;
	}
	if (mode.value === "manual" && !payload.title) {
		error.value = "Введите название трека";
		return;
	}

	submitting.value = true;
	try {
		await $fetch<TrackDto>("/api/activity-music/add", {
			method: "POST",
			query: { id: props.activityId },
			body: payload,
		});
		await fetchList();
		closeModal();
	} catch (e: unknown) {
		const err = e as { data?: { message?: string }; message?: string };
		error.value = err.data?.message ?? err.message ?? "Ошибка";
	} finally {
		submitting.value = false;
	}
};

const removeTrack = async (id: string): Promise<void> => {
	try {
		await $fetch("/api/activity-music/track", {
			method: "DELETE",
			query: { activityId: props.activityId, trackId: id },
		});
		await fetchList();
	} catch {}
};

const displayTitle = (t: TrackDto): string => {
	if (t.title && t.author) return `${t.title} — ${t.author}`;
	if (t.title) return t.title;
	if (t.link) return t.link;
	return "Трек";
};

const coverFor = (t: TrackDto): string => {
	if (!t.cover) return "";
	if (t.cover.startsWith("//")) return "https:" + t.cover;
	return t.cover;
};

const onTrackClick = (t: TrackDto, e: MouseEvent): void => {
	if (!t.link) {
		e.preventDefault();
		return;
	}
};

const onEsc = (e: KeyboardEvent): void => {
	if (e.key === "Escape" && modalOpen.value) closeModal();
};

onMounted(() => window.addEventListener("keydown", onEsc));
onBeforeUnmount(() => window.removeEventListener("keydown", onEsc));
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.header">
			<h2 :class="$style.title">
				Плейлист
				<span :class="$style.count">({{ tracks.length }})</span>
			</h2>
			<UiButton v-if="canEdit" accent @click="openModal">
				<Icon
					name="material-symbols:add-rounded"
					:class="$style.icon"
				/>
				Добавить трек
			</UiButton>
		</div>

		<p
			v-if="tracks.length === 0"
			:class="$style.empty"
		>
			Треков пока нет.
		</p>

		<ul v-else :class="$style.list">
			<li
				v-for="t in visibleTracks"
				:key="t.id"
				:class="$style.item"
			>
				<component
					:is="t.link ? 'a' : 'div'"
					:href="t.link || undefined"
					target="_blank"
					rel="noopener noreferrer"
					:class="[$style.row, t.link && $style.rowClickable]"
					@click="onTrackClick(t, $event)"
				>
					<div :class="$style.coverBox">
						<img
							v-if="coverFor(t)"
							:src="coverFor(t)"
							:class="$style.cover"
							loading="lazy"
							alt=""
							referrerpolicy="no-referrer"
						/>
						<Icon
							v-else
							:name="
								t.link
									? 'mdi:music-note'
									: 'mdi:music-note-outline'
							"
							:class="$style.itemIcon"
						/>
					</div>
					<span :class="$style.name">{{ displayTitle(t) }}</span>
					<Icon
						v-if="t.link"
						name="mdi:open-in-new"
						:class="$style.openIcon"
					/>
				</component>
				<UiButton
					v-if="t.addedBy === selfUserId || canEdit"
					unset
					:class="$style.deleteBtn"
					@click="removeTrack(t.id)"
				>
					<Icon
						name="mdi:close"
						:class="$style.deleteIcon"
					/>
				</UiButton>
			</li>
		</ul>

		<UiButton
			v-if="hasMore"
			unset
			:class="$style.toggle"
			@click="expanded = !expanded"
		>
			{{
				expanded
					? "Свернуть"
					: `Показать все (${tracks.length})`
			}}
			<Icon
				:name="
					expanded
						? 'mdi:chevron-up'
						: 'mdi:chevron-down'
				"
				:class="$style.toggleIcon"
			/>
		</UiButton>

		<Teleport to="body">
			<div
				v-if="modalOpen"
				:class="$style.overlay"
				@click="closeModal"
			>
				<div :class="$style.dialog" @click.stop>
					<div :class="$style.dialogHead">
						<h3 :class="$style.dialogTitle">Добавить трек</h3>
						<UiButton
							unset
							:class="$style.closeBtn"
							@click="closeModal"
						>
							<Icon
								name="mdi:close"
								:class="$style.closeIcon"
							/>
						</UiButton>
					</div>

					<div :class="$style.tabs">
						<UiButton
							:inset="mode !== 'link'"
							:accent="mode === 'link'"
							@click="mode = 'link'"
						>
							По ссылке
						</UiButton>
						<UiButton
							:inset="mode !== 'manual'"
							:accent="mode === 'manual'"
							@click="mode = 'manual'"
						>
							Вручную
						</UiButton>
					</div>

					<div v-if="mode === 'link'" :class="$style.field">
						<label :class="$style.label">
							Ссылка на трек (Яндекс.Музыка, Spotify, YouTube…)
						</label>
						<UiInput
							v-model="form.link"
							placeholder="https://music.yandex.ru/..."
						/>
					</div>

					<template v-else>
						<div :class="$style.field">
							<label :class="$style.label">
								Название трека
							</label>
							<UiInput
								v-model="form.title"
								placeholder="Группа крови"
							/>
						</div>
						<div :class="$style.field">
							<label :class="$style.label">Исполнитель</label>
							<UiInput
								v-model="form.author"
								placeholder="Кино"
							/>
						</div>
					</template>

					<p v-if="error" :class="$style.errorMsg">{{ error }}</p>

					<div :class="$style.actions">
						<UiButton inset @click="closeModal">Отмена</UiButton>
						<UiButton
							accent
							:disabled="submitting"
							@click="submit"
						>
							{{ submitting ? "Добавление…" : "Добавить" }}
						</UiButton>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<style module lang="scss">
.wrapper {
	display: flex;
	flex-direction: column;
	row-gap: 12px;
	width: 100%;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 12px;

	.title {
		@include reset;
		@include title-m;
		@include color-black;

		.count {
			@include text-s;
			opacity: 0.5;
			margin-left: 6px;
			font-weight: 400;
		}
	}

	.icon {
		width: 18px;
		height: 18px;
		margin-right: 6px;
	}
}

.empty {
	@include text-s;
	@include color-black;

	opacity: 0.55;
	margin: 0;
}

.list {
	@include reset;

	display: flex;
	flex-direction: column;
	row-gap: 4px;

	.item {
		@include color-white-bg(0.6);

		display: flex;
		align-items: stretch;
		column-gap: 4px;
		border-radius: 8px;
		transition: background-color $transition-fast;

		&:hover {
			@include color-white-bg(0.9);
		}
	}
}

.row {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	column-gap: 10px;
	padding: 8px 14px;
	text-decoration: none;
	color: inherit;

	&.rowClickable {
		cursor: pointer;
	}

	.coverBox {
		width: 40px;
		height: 40px;
		flex-shrink: 0;
		border-radius: 6px;
		overflow: hidden;
		background: rgba($color-black-rgb, 0.06);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cover {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.itemIcon {
		width: 20px;
		height: 20px;
		opacity: 0.6;
	}

	.name {
		@include text-m;
		@include color-black;

		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.openIcon {
		width: 14px;
		height: 14px;
		opacity: 0.4;
		flex-shrink: 0;
	}
}

.deleteBtn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	padding: 0;
	opacity: 0.4;
	transition: opacity $transition-fast;

	&:hover {
		opacity: 0.9;
	}

	.deleteIcon {
		width: 16px;
		height: 16px;
	}
}

.toggle {
	@include text-s;
	@include color-black;

	display: flex;
	align-items: center;
	justify-content: center;
	column-gap: 4px;
	padding: 8px;
	opacity: 0.7;

	&:hover {
		opacity: 1;
	}

	.toggleIcon {
		width: 16px;
		height: 16px;
	}
}

.overlay {
	@include modal-backdrop;

	position: fixed;
	inset: 0;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	box-sizing: border-box;
}

.dialog {
	@include color-white-bg;
	@include shadow;

	width: 100%;
	max-width: 480px;
	padding: 20px;
	border-radius: 14px;
	display: flex;
	flex-direction: column;
	row-gap: 14px;
}

.dialogHead {
	display: flex;
	align-items: center;
	justify-content: space-between;

	.dialogTitle {
		@include reset;
		@include title-s;
		@include color-black;
	}

	.closeBtn {
		padding: 4px;

		.closeIcon {
			width: 20px;
			height: 20px;
		}
	}
}

.tabs {
	display: flex;
	column-gap: 8px;
}

.field {
	display: flex;
	flex-direction: column;
	row-gap: 6px;

	.label {
		@include text-s;
		@include color-black;

		opacity: 0.7;
	}
}

.errorMsg {
	@include text-s;
	@include color-error-bg;

	padding: 8px 12px;
	border-radius: 8px;
	margin: 0;
}

.actions {
	display: flex;
	justify-content: flex-end;
	column-gap: 10px;
}
</style>
