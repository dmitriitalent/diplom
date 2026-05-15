<script setup lang="ts">
import type { Cached } from "~/stores/cacheStore";
import type { Activity } from "~/entities/Activity";
import { useDevice } from "~/composables/device";

const props = defineProps<{
	activity: Cached<Activity>;
	isAdmin: boolean;
	isAuthor: boolean;
	isParticipant: boolean;
	moderateForm: { comment: string; status: string };
	inviteCode: string | null;
}>();

const emit = defineEmits<{
	(e: "delete"): void;
	(e: "edit"): void;
	(e: "join"): void;
	(e: "leave"): void;
	(e: "moderate", status: string): void;
	(e: "generate-invite", form: { maxUses: number }): void;
}>();

const { deviceClassList } = useDevice();

const bookmarks = useBookmarks("activity");
const isBookmarked = computed(() =>
	props.activity.id ? bookmarks.isBookmarked(props.activity.id) : false,
);
const bookmarkLimitReached = ref(false);
const onToggleBookmark = () => {
	if (!props.activity.id) return;
	bookmarkLimitReached.value = false;
	const ok = bookmarks.toggle(props.activity.id);
	if (!ok) bookmarkLimitReached.value = true;
};

// Admin panel
const adminDecision = ref<"approve" | "reject" | "block" | null>(null);

const applyModeration = () => {
	if (!adminDecision.value) return;
	const map: Record<string, string> = {
		approve: "approved",
		reject: "declined",
		block: "blocked",
	};
	emit("moderate", map[adminDecision.value]);
	adminDecision.value = null;
};

// Owner invite
const inviteUses = ref(5);
const inviteForm = ref({ maxUses: 5 });
const copied = ref(false);

const generateInvite = () => {
	inviteForm.value.maxUses = inviteUses.value;
	emit("generate-invite", inviteForm.value);
	copied.value = false;
};

const copyInvite = () => {
	if (!props.inviteCode) return;
	navigator.clipboard?.writeText(props.inviteCode);
	copied.value = true;
	setTimeout(() => (copied.value = false), 1600);
};

// Date formatting
const startDate = computed(() => {
	if (!props.activity.startTime) return null;
	const d = new Date(props.activity.startTime);
	return {
		day: d.getDate(),
		month: d.toLocaleString("ru-RU", { month: "short" }),
		weekday: d.toLocaleString("ru-RU", { weekday: "long" }),
		time: d.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
	};
});

const endTime = computed(() => {
	if (!props.activity.endTime) return "";
	const d = new Date(props.activity.endTime);
	return d.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" });
});

const durationMs = computed(() => {
	if (!props.activity.startTime || !props.activity.endTime) return "";
	const diff =
		new Date(props.activity.endTime).getTime() -
		new Date(props.activity.startTime).getTime();
	const h = Math.floor(diff / 3600000);
	const m = Math.floor((diff % 3600000) / 60000);
	if (h === 0) return `${m} мин`;
	if (m === 0) return `${h} ч`;
	return `${h} ч ${m} мин`;
});

const createdAt = computed(() => {
	if (!props.activity.createdAt) return "";
	return new Date(props.activity.createdAt).toLocaleString("ru-RU", {
		day: "2-digit",
		month: "long",
		hour: "2-digit",
		minute: "2-digit",
	});
});

const updatedAt = computed(() => {
	if (!props.activity.updatedAt) return "";
	return new Date(props.activity.updatedAt).toLocaleString("ru-RU", {
		day: "2-digit",
		month: "long",
		hour: "2-digit",
		minute: "2-digit",
	});
});

const goingParticipants = computed(() =>
	(props.activity.participants ?? []).filter(
		(p: any) => p.status === "going" || !p.status,
	),
);

const moderationLabel = computed(() => {
	const map: Record<string, string> = {
		pending: "ждёт решения",
		approved: "опубликовано",
		declined: "отклонено",
		blocked: "заблокировано",
	};
	return (
		map[props.activity.moderationStatus ?? ""] ??
		props.activity.moderationStatus ??
		""
	);
});
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<!-- Breadcrumbs -->
			<div :class="$style.crumbs">
				<RouterLink to="/activities" :class="$style.crumbLink"
					>Афиша</RouterLink
				>
				<Icon name="mdi:chevron-right" :class="$style.crumbSep" />
				<span :class="$style.crumbCurrent">{{ activity.title }}</span>
			</div>

			<!-- Admin panel -->
			<div v-if="isAdmin" :class="$style.panel">
				<div :class="$style.panelHead">
					<div :class="$style.panelIcon">
						<Icon
							name="mdi:shield-crown-outline"
							:class="$style.panelIconInner"
						/>
					</div>
					<div :class="$style.panelMeta">
						<span :class="$style.panelTitle"
							>Панель модератора</span
						>
						<span :class="$style.panelSub"
							>статус · {{ moderationLabel }}</span
						>
					</div>
					<div :class="$style.panelActions">
						<button :class="$style.chipBtn" @click="emit('edit')">
							<Icon
								name="mdi:pencil-outline"
								:class="$style.chipIcon"
							/>
							Редактировать
						</button>
						<button
							:class="[$style.chipBtn, $style.chipBtnDanger]"
							@click="emit('delete')"
						>
							<Icon
								name="mdi:trash-can-outline"
								:class="$style.chipIcon"
							/>
							Удалить
						</button>
					</div>
				</div>

				<div
					v-if="activity.moderationStatus === 'pending'"
					:class="$style.panelDecisions"
				>
					<span :class="$style.panelLabel">Решение</span>
					<div :class="$style.decisionsRow">
						<button
							:class="[
								$style.decisionBtn,
								adminDecision === 'approve' &&
									$style.decisionApprove,
							]"
							@click="
								adminDecision =
									adminDecision === 'approve'
										? null
										: 'approve'
							"
						>
							<Icon
								name="mdi:check-circle"
								:class="$style.chipIcon"
							/>
							Одобрить и опубликовать
						</button>
						<button
							:class="[
								$style.decisionBtn,
								adminDecision === 'reject' &&
									$style.decisionReject,
							]"
							@click="
								adminDecision =
									adminDecision === 'reject' ? null : 'reject'
							"
						>
							<Icon
								name="mdi:close-circle"
								:class="$style.chipIcon"
							/>
							Отклонить
						</button>
						<button
							:class="[
								$style.decisionBtn,
								adminDecision === 'block' &&
									$style.decisionBlock,
							]"
							@click="
								adminDecision =
									adminDecision === 'block' ? null : 'block'
							"
						>
							<Icon
								name="mdi:account-cancel"
								:class="$style.chipIcon"
							/>
							Заблокировать
						</button>
					</div>
					<UiTextarea
						v-model="props.moderateForm.comment"
						:rows="2"
						placeholder="Комментарий к решению"
						:class="$style.panelTextarea"
					/>
					<div :class="$style.panelFoot">
						<UiButton @click="adminDecision = null"
							>Сбросить</UiButton
						>
						<UiButton
							accent
							:disabled="!adminDecision"
							@click="applyModeration"
							>Применить</UiButton
						>
					</div>
				</div>
			</div>

			<!-- Owner panel -->
			<div v-else-if="isAuthor" :class="$style.panel">
				<div :class="$style.panelHead">
					<div :class="[$style.panelIcon, $style.panelIconOwner]">
						<Icon
							name="mdi:star-four-points-outline"
							:class="$style.panelIconInner"
						/>
					</div>
					<div :class="$style.panelMeta">
						<span :class="$style.panelTitle"
							>Управление мероприятием</span
						>
						<span :class="$style.panelSub"
							>вы автор · видно только вам</span
						>
					</div>
					<div :class="$style.panelActions">
						<button :class="$style.chipBtn" @click="emit('edit')">
							<Icon
								name="mdi:pencil-outline"
								:class="$style.chipIcon"
							/>
							Редактировать
						</button>
						<button
							:class="[$style.chipBtn, $style.chipBtnDanger]"
							@click="emit('delete')"
						>
							<Icon
								name="mdi:trash-can-outline"
								:class="$style.chipIcon"
							/>
							Удалить
						</button>
					</div>
				</div>

				<div v-if="activity.isPrivate" :class="$style.inviteBox">
					<div :class="$style.inviteHead">
						<span :class="$style.inviteTitle"
							>Создать приглашение</span
						>
					</div>
					<div :class="$style.inviteControls">
						<div :class="$style.usesRow">
							<span :class="$style.usesLabel"
								>Использований:</span
							>
							<div :class="$style.usesCounter">
								<button
									:class="$style.usesBtn"
									@click="
										inviteUses = Math.max(1, inviteUses - 1)
									"
								>
									<Icon
										name="mdi:minus"
										:class="$style.usesBtnIcon"
									/>
								</button>
								<span :class="$style.usesVal">{{
									inviteUses
								}}</span>
								<button
									:class="$style.usesBtn"
									@click="
										inviteUses = Math.min(
											99,
											inviteUses + 1,
										)
									"
								>
									<Icon
										name="mdi:plus"
										:class="$style.usesBtnIcon"
									/>
								</button>
							</div>
							<div :class="$style.usesPresets">
								<button
									v-for="n in [1, 5, 25, 999]"
									:key="n"
									:class="[
										$style.usesPreset,
										inviteUses === n &&
											$style.usesPresetActive,
									]"
									@click="inviteUses = n"
								>
									{{ n === 999 ? "∞" : n }}
								</button>
							</div>
						</div>
						<UiButton accent @click="generateInvite">
							<Icon name="mdi:key-plus" :class="$style.btnIcon" />
							Сгенерировать
						</UiButton>
					</div>
					<div v-if="inviteCode" :class="$style.inviteResult">
						<Icon
							name="mdi:link-variant"
							:class="$style.inviteLinkIcon"
						/>
						<code :class="$style.inviteCode">{{ inviteCode }}</code>
						<button :class="$style.copyBtn" @click="copyInvite">
							<Icon
								:name="
									copied ? 'mdi:check' : 'mdi:content-copy'
								"
								:class="$style.chipIcon"
							/>
							{{ copied ? "Скопировано" : "Скопировать" }}
						</button>
					</div>
				</div>
			</div>

			<!-- Main grid -->
			<div :class="$style.grid">
				<!-- Left: gallery + description + participants -->
				<div :class="$style.left">
					<UiGallery :class="$style.gallery" :autoplay="3000" loop>
						<template
							v-for="(image, index) in activity.imageIds"
							:key="index"
							v-slot:[index]
						>
							<img
								:class="$style.galleryImg"
								:src="`/api/images/byGuid?guid=${image}`"
							/>
						</template>
					</UiGallery>

					<div :class="$style.titleBlock">
						<span :class="$style.subLabel">мероприятие</span>
						<h1 :class="$style.title">{{ activity.title }}</h1>
					</div>

					<div :class="$style.article">
						<h2 :class="$style.articleTitle">О мероприятии</h2>
						<p :class="$style.articleText">
							{{ activity.description }}
						</p>
					</div>

					<section
						v-if="goingParticipants.length > 0"
						:class="$style.participants"
					>
						<h2 :class="$style.articleTitle">
							Записались · {{ goingParticipants.length }}
						</h2>
						<div :class="$style.participantsGrid">
							<RouterLink
								v-for="p in goingParticipants"
								:key="p.id"
								:to="`/profile/${p.id}`"
								:class="$style.participantCard"
							>
								<UiImage
									:src="`/api/images/byGuid?guid=${p.avatarId}`"
									:class="$style.participantAvatar"
								/>
								<div :class="$style.participantInfo">
									<span :class="$style.participantName">
										{{ p.name }} {{ p.surname }}
									</span>
								</div>
							</RouterLink>
						</div>
					</section>
				</div>

				<!-- Right: sticky sidebar -->
				<aside :class="$style.sidebar">
					<span
						v-if="activity.isPrivate"
						:class="$style.privateBadge"
					>
						<Icon
							name="mdi:lock-outline"
							:class="$style.badgeIcon"
						/>
						Приватное · по приглашениям
					</span>

					<!-- When -->
					<div v-if="startDate" :class="$style.sideRow">
						<div :class="$style.dateBadge">
							<span :class="$style.dateBadgeMonth">{{
								startDate.month
							}}</span>
							<span :class="$style.dateBadgeDay">{{
								startDate.day
							}}</span>
						</div>
						<div :class="$style.sideInfo">
							<span :class="$style.sideInfoMain">
								{{ startDate.weekday }}, {{ startDate.time }} –
								{{ endTime }}
							</span>
							<span :class="$style.sideInfoSub"
								>длительность {{ durationMs }}</span
							>
						</div>
					</div>

					<!-- Where -->
					<div v-if="activity.location" :class="$style.sideRow">
						<div :class="$style.sideIconBox">
							<Icon
								name="mdi:map-marker-outline"
								:class="$style.sideIcon"
							/>
						</div>
						<div :class="$style.sideInfo">
							<span :class="$style.sideInfoMain">{{
								activity.location
							}}</span>
						</div>
					</div>

					<!-- Author -->
					<div
						v-if="activity.author"
						:class="[$style.sideRow, $style.sideRowBorder]"
					>
						<RouterLink
							:to="`/profile/${activity.author.id}`"
							:class="$style.authorLink"
						>
							<UiImage
								:src="`/api/images/byGuid?guid=${activity.author.avatarId}`"
								:class="$style.authorAvatar"
							/>
							<div :class="$style.authorInfo">
								<span :class="$style.authorName">
									{{ activity.author.name }}
									{{ activity.author.surname }}
								</span>
								<span :class="$style.authorRole"
									>организатор</span
								>
							</div>
						</RouterLink>
					</div>

					<!-- RSVP -->
					<div :class="[$style.rsvp, $style.sideRowBorder]">
						<div :class="$style.rsvpHead">
							<span :class="$style.rsvpLabel">Запись</span>
							<span :class="$style.rsvpCount">
								{{ goingParticipants.length }} человек
							</span>
						</div>
						<UiButton
							:accent="!isParticipant"
							@click="
								isParticipant ? emit('leave') : emit('join')
							"
						>
							<Icon
								:name="
									isParticipant
										? 'mdi:check-bold'
										: 'mdi:plus'
								"
								:class="$style.btnIcon"
							/>
							{{
								isParticipant
									? "Вы записаны · отменить"
									: "Записаться"
							}}
						</UiButton>
						<UiButton :accent="isBookmarked" @click="onToggleBookmark">
							<Icon
								:name="
									isBookmarked
										? 'mdi:bookmark'
										: 'mdi:bookmark-outline'
								"
								:class="$style.btnIcon"
							/>
							{{ isBookmarked ? "В закладках" : "Сохранить" }}
						</UiButton>
						<div
							v-if="bookmarkLimitReached"
							:class="$style.bookmarkHint"
						>
							Достигнут лимит — 10 закладок
						</div>
					</div>

					<!-- Meta -->
					<div :class="[$style.metaBlock, $style.sideRowBorder]">
						<span v-if="createdAt" :class="$style.metaItem">
							<Icon
								name="mdi:calendar-outline"
								:class="$style.metaIcon"
							/>
							создано {{ createdAt }}
						</span>
						<span v-if="updatedAt" :class="$style.metaItem">
							<Icon
								name="mdi:pencil-outline"
								:class="$style.metaIcon"
							/>
							обновлено {{ updatedAt }}
						</span>
					</div>
				</aside>
			</div>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	position: relative;
	min-height: 100dvh;
	overflow-x: clip;

	.container {
		position: relative;
		z-index: 2;

		@include container;

		padding: 30px 0 100px;
		display: flex;
		flex-direction: column;
		row-gap: 20px;

		@include respond-to(mobile) {
			@include container(mobile);

			padding: 20px 0 60px;
			row-gap: 16px;
		}
	}

	// Breadcrumbs
	.crumbs {
		display: flex;
		align-items: center;
		column-gap: 8px;

		@include text-s;
		@include color-black(0.55);
	}

	.crumbLink {
		@include color-black(0.55);

		text-decoration: none;

		&:hover {
			@include color-black;
		}
	}

	.crumbSep {
		width: 12px;
		height: 12px;
	}

	.crumbCurrent {
		@include color-black;
	}

	// Panel (admin/owner)
	.panel {
		padding: 20px;
		border-radius: 12px;
		border: 1px dashed rgba($color-black-rgb, 0.18);
		display: flex;
		flex-direction: column;
		row-gap: 14px;

		@include color-white-bg;
		@include shadow;
	}

	.panelHead {
		display: flex;
		align-items: center;
		column-gap: 10px;
		flex-wrap: wrap;
		row-gap: 8px;
	}

	.panelIcon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		@include color-black-bg;
	}

	.panelIconOwner {
		background: #fff1bf;
	}

	.panelIconInner {
		width: 18px;
		height: 18px;

		@include color-white;

		.panelIconOwner & {
			@include color-black;
		}
	}

	.panelMeta {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.panelTitle {
		@include text-m;
		@include color-black;

		font-weight: 600;
	}

	.panelSub {
		@include text-s;
		@include color-black(0.55);
	}

	.panelActions {
		display: flex;
		column-gap: 8px;
		flex-wrap: wrap;
		row-gap: 8px;
	}

	.chipBtn {
		display: inline-flex;
		align-items: center;
		column-gap: 6px;
		padding: 8px 12px;
		border-radius: 10px;
		background: transparent;
		border: 1px solid rgba($color-black-rgb, 0.15);
		cursor: pointer;

		@include text-s;
		@include color-black;

		font-weight: 600;

		&:hover {
			@include color-black-bg(0.06);
		}
	}

	.chipBtnDanger {
		color: rgba(122, 28, 28, 1);
		border-color: rgba(122, 28, 28, 0.25);
	}

	.chipIcon {
		width: 14px;
		height: 14px;
	}

	.panelDecisions {
		display: flex;
		flex-direction: column;
		row-gap: 10px;
	}

	.panelLabel {
		@include text-xs;
		@include color-black(0.55);

		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.decisionsRow {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.decisionBtn {
		display: inline-flex;
		align-items: center;
		column-gap: 8px;
		padding: 10px 14px;
		border-radius: 10px;
		border: 0;
		cursor: pointer;

		@include color-black-bg(0.04);
		@include text-s;
		@include color-black;

		font-weight: 600;
		transition: background 0.15s;
	}

	.decisionApprove {
		background: #efffde;
		color: #1c5b1c;
		box-shadow: inset 0 0 0 1px #1c5b1c;
	}

	.decisionReject {
		background: #ffcdcd;
		color: #7a1c1c;
		box-shadow: inset 0 0 0 1px #7a1c1c;
	}

	.decisionBlock {
		background: rgba($color-black-rgb, 0.85);

		@include color-white;

		box-shadow: inset 0 0 0 1px $color-black;
	}

	.panelTextarea {
		width: 100%;
	}

	.panelFoot {
		display: flex;
		justify-content: flex-end;
		column-gap: 10px;
	}

	// Invite box (owner)
	.inviteBox {
		display: flex;
		flex-direction: column;
		row-gap: 10px;
		padding: 14px;
		border-radius: 10px;
		background: rgba(255, 241, 191, 0.4);
	}

	.inviteHead {
		display: flex;
		justify-content: space-between;
	}

	.inviteTitle {
		@include text-m;
		@include color-black;

		font-weight: 600;
	}

	.inviteControls {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
	}

	.usesRow {
		display: flex;
		align-items: center;
		column-gap: 10px;
		flex-wrap: wrap;
		row-gap: 8px;
	}

	.usesLabel {
		@include text-s;
		@include color-black(0.75);
	}

	.usesCounter {
		display: inline-flex;
		align-items: center;
		border: 1px solid rgba($color-black-rgb, 0.15);
		border-radius: 100px;

		@include color-white-bg;
	}

	.usesBtn {
		width: 28px;
		height: 28px;
		border: 0;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.usesBtnIcon {
		@include color-black;

		width: 14px;
		height: 14px;
	}

	.usesVal {
		min-width: 28px;
		text-align: center;

		@include text-m;
		@include color-black;

		font-weight: 600;
	}

	.usesPresets {
		display: flex;
		column-gap: 6px;
	}

	.usesPreset {
		padding: 4px 10px;
		border-radius: 100px;
		border: 1px solid rgba($color-black-rgb, 0.12);
		background: transparent;
		cursor: pointer;

		@include text-xs;
		@include color-black;

		&:hover {
			@include color-black-bg(0.06);
		}
	}

	.usesPresetActive {
		@include color-black-bg;
		@include color-white;
	}

	.inviteResult {
		display: flex;
		align-items: center;
		column-gap: 8px;
		padding: 10px 14px;
		border-radius: 10px;
		border: 1px solid rgba($color-black-rgb, 0.12);

		@include color-white-bg;
	}

	.inviteLinkIcon {
		@include color-black(0.55);

		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.inviteCode {
		flex: 1;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 13px;

		@include color-black;

		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.copyBtn {
		display: inline-flex;
		align-items: center;
		column-gap: 6px;
		padding: 6px 12px;
		border-radius: 8px;
		border: 1px solid rgba($color-black-rgb, 0.15);
		background: transparent;
		cursor: pointer;

		@include text-xs;
		@include color-black;
	}

	// Main grid
	.grid {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 28px;
		align-items: flex-start;

		@include respond-to(mobile) {
			grid-template-columns: 1fr;
			gap: 20px;
		}
	}

	.left {
		display: flex;
		flex-direction: column;
		row-gap: 24px;
		min-width: 0;
	}

	// Gallery
	.gallery {
		height: 440px;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;

		@include color-black-bg(0.1);
		@include shadow;

		@include respond-to(mobile) {
			width: 100%;
			height: 260px;
		}

		.galleryImg {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	// Title
	.titleBlock {
		display: flex;
		flex-direction: column;
		row-gap: 6px;
	}

	.subLabel {
		@include text-xs;
		@include color-black(0.55);

		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.title {
		@include reset;
		@include title-l;
		@include color-black;

		@include respond-to(mobile) {
			@include title-m;
		}
	}

	// Article
	.article {
		padding: 28px;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		row-gap: 16px;

		@include color-white-bg;
		@include shadow;

		@include respond-to(mobile) {
			padding: 16px;
		}
	}

	.articleTitle {
		@include reset;
		@include title-s;
		@include color-black;
	}

	.articleText {
		@include reset;
		@include text-m;
		@include color-black;

		line-height: 1.65;
		white-space: pre-wrap;
	}

	// Participants
	.participants {
		display: flex;
		flex-direction: column;
		row-gap: 14px;
	}

	.participantsGrid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 12px;

		@include respond-to(mobile) {
			grid-template-columns: 1fr;
		}
	}

	.participantCard {
		display: flex;
		align-items: center;
		column-gap: 10px;
		padding: 12px;
		border-radius: 12px;
		text-decoration: none;

		@include color-white-bg;
		@include shadow;

		&:hover {
			@include color-black-bg(0.04);
		}
	}

	.participantAvatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		flex-shrink: 0;
		background: #fff1bf;
	}

	.participantInfo {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.participantName {
		@include text-s;
		@include color-black;

		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	// Sidebar
	.sidebar {
		position: sticky;
		top: 70px;
		display: flex;
		flex-direction: column;
		row-gap: 14px;
		padding: 24px;
		border-radius: 12px;
		min-width: 0;

		@include color-white-bg;
		@include shadow;

		@include respond-to(mobile) {
			position: static;
			padding: 16px;
		}
	}

	.privateBadge {
		display: inline-flex;
		align-items: center;
		column-gap: 6px;
		padding: 4px 12px;
		border-radius: 100px;
		width: fit-content;

		@include color-black-bg(0.06);
		@include text-xs;
		@include color-black(0.7);

		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.badgeIcon {
		width: 13px;
		height: 13px;
	}

	.sideRow {
		display: flex;
		column-gap: 14px;
		align-items: flex-start;
	}

	.sideRowBorder {
		padding-top: 12px;
		border-top: 1px solid rgba($color-black-rgb, 0.08);
	}

	.dateBadge {
		width: 54px;
		height: 54px;
		border-radius: 10px;
		background: #fff1bf;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.dateBadgeMonth {
		@include text-xs;

		color: rgba(38, 28, 7, 0.6);
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.dateBadgeDay {
		@include title-s;

		color: #261c07;
		line-height: 1;
	}

	.sideIconBox {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		@include color-black-bg(0.05);
	}

	.sideIcon {
		@include color-black;

		width: 20px;
		height: 20px;
	}

	.sideInfo {
		display: flex;
		flex-direction: column;
		row-gap: 2px;
	}

	.sideInfoMain {
		@include text-m;
		@include color-black;

		font-weight: 600;
	}

	.sideInfoSub {
		@include text-s;
		@include color-black(0.55);
	}

	// Author
	.authorLink {
		display: flex;
		align-items: center;
		column-gap: 12px;
		text-decoration: none;
		width: 100%;
	}

	.authorAvatar {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: #fff1bf;
		flex-shrink: 0;
	}

	.authorInfo {
		display: flex;
		flex-direction: column;
	}

	.authorName {
		@include text-m;
		@include color-black;

		font-weight: 600;
	}

	.authorRole {
		@include text-s;
		@include color-black(0.55);
	}

	// RSVP
	.rsvp {
		display: flex;
		flex-direction: column;
		row-gap: 10px;
	}

	.bookmarkHint {
		@include text-s;
		@include color-error;
	}

	.rsvpHead {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.rsvpLabel {
		@include text-xs;
		@include color-black(0.55);

		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.rsvpCount {
		@include text-s;
		@include color-black(0.55);
	}

	.btnIcon {
		width: 16px;
		height: 16px;
	}

	// Meta
	.metaBlock {
		display: flex;
		flex-direction: column;
		row-gap: 6px;
	}

	.metaItem {
		display: inline-flex;
		align-items: center;
		column-gap: 6px;

		@include text-s;
		@include color-black(0.55);
	}

	.metaIcon {
		width: 13px;
		height: 13px;
	}
}
</style>
