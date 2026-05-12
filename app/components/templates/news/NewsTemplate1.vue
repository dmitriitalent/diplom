<script setup lang="ts">
import type { Cached } from "~/stores/cacheStore";
import type { News } from "~/entities/News";
import { useDevice } from "~/composables/device";

const props = defineProps<{
	news: Cached<News>;
	isAdmin: boolean;
	isAuthor: boolean;
	moderateForm: { comment: string; status: string };
	moderationStatus: string;
}>();

const emit = defineEmits<{
	(e: "delete"): void;
	(e: "edit"): void;
	(e: "moderate", status: string): void;
}>();

const { deviceClassList } = useDevice();

const moderationBadge = computed(() => {
	const map: Record<string, { bg: string; color: string; label: string; icon: string }> = {
		approved: { bg: "#efffde", color: "#1c5b1c", label: "Опубликовано", icon: "mdi:check-circle-outline" },
		pending: { bg: "#fff3c8", color: "#7a5a00", label: "На проверке", icon: "mdi:clock-outline" },
		declined: { bg: "#ffcdcd", color: "#7a1c1c", label: "Отклонено", icon: "mdi:close-circle-outline" },
		rejected: { bg: "#ffcdcd", color: "#7a1c1c", label: "Отклонено", icon: "mdi:close-circle-outline" },
	};
	return map[props.moderationStatus] ?? map.approved;
});

const createdAt = computed(() => {
	if (!props.news.createdAt) return "";
	return new Date(props.news.createdAt).toLocaleString("ru-RU", {
		day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
	});
});

const updatedAt = computed(() => {
	if (!props.news.updatedAt || props.news.updatedAt === props.news.createdAt) return "";
	return new Date(props.news.updatedAt).toLocaleString("ru-RU", {
		day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
	});
});

// Admin moderation
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
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<ShaderComponent :class="$style.shader" />
		<div :class="$style.container">
			<!-- Breadcrumbs -->
			<div :class="$style.crumbs">
				<RouterLink to="/news" :class="$style.crumbLink">Новости</RouterLink>
				<Icon name="mdi:chevron-right" :class="$style.crumbSep" />
				<span :class="$style.crumbCurrent">{{ news.title }}</span>
			</div>

			<!-- Header card: status + title + author -->
			<div :class="$style.headerCard">
				<div :class="$style.headerTop">
					<span
						:class="$style.statusBadge"
						:style="{ background: moderationBadge.bg, color: moderationBadge.color }"
					>
						<Icon :name="moderationBadge.icon" :class="$style.badgeIcon" />
						{{ moderationBadge.label }}
					</span>
					<div :class="$style.dateMeta">
						<span v-if="createdAt" :class="$style.metaItem">
							<Icon name="mdi:calendar-outline" :class="$style.metaIcon" />
							{{ createdAt }}
						</span>
						<span v-if="updatedAt" :class="$style.metaItem">
							<Icon name="mdi:pencil-outline" :class="$style.metaIcon" />
							ред. {{ updatedAt }}
						</span>
					</div>
				</div>

				<!-- Admin/Author actions -->
				<div v-if="isAdmin || isAuthor" :class="$style.headerActions">
					<button :class="$style.chipBtn" @click="emit('edit')">
						<Icon name="mdi:pencil-outline" :class="$style.chipIcon" />
						Редактировать
					</button>
					<button
						v-if="isAdmin"
						:class="[$style.chipBtn, $style.chipBtnDanger]"
						@click="emit('delete')"
					>
						<Icon name="mdi:trash-can-outline" :class="$style.chipIcon" />
						Удалить
					</button>
				</div>

				<!-- Admin moderation panel -->
				<div v-if="isAdmin && moderationStatus === 'pending'" :class="$style.moderatePanel">
					<span :class="$style.panelLabel">Решение</span>
					<div :class="$style.decisionsRow">
						<button
							:class="[$style.decisionBtn, adminDecision === 'approve' && $style.decisionApprove]"
							@click="adminDecision = adminDecision === 'approve' ? null : 'approve'"
						>
							<Icon name="mdi:check-circle" :class="$style.chipIcon" />
							Одобрить
						</button>
						<button
							:class="[$style.decisionBtn, adminDecision === 'reject' && $style.decisionReject]"
							@click="adminDecision = adminDecision === 'reject' ? null : 'reject'"
						>
							<Icon name="mdi:close-circle" :class="$style.chipIcon" />
							Отклонить
						</button>
						<button
							:class="[$style.decisionBtn, adminDecision === 'block' && $style.decisionBlock]"
							@click="adminDecision = adminDecision === 'block' ? null : 'block'"
						>
							<Icon name="mdi:account-cancel" :class="$style.chipIcon" />
							Заблокировать
						</button>
					</div>
					<UiTextarea
						v-model="props.moderateForm.comment"
						:rows="2"
						placeholder="Комментарий к решению"
					/>
					<div :class="$style.moderateFoot">
						<UiButton @click="adminDecision = null">Сбросить</UiButton>
						<UiButton accent :disabled="!adminDecision" @click="applyModeration">
							Применить
						</UiButton>
					</div>
				</div>

				<h1 :class="$style.title">{{ news.title }}</h1>

				<div v-if="news.author" :class="$style.authorRow">
					<RouterLink :to="`/profile/${news.author.id}`" :class="$style.authorLink">
						<img
							:src="`/api/images/byGuid?guid=avatar`"
							:class="$style.authorAvatar"
						/>
						<div :class="$style.authorInfo">
							<span :class="$style.authorName">
								{{ news.author.name }} {{ news.author.surname }}
							</span>
						</div>
					</RouterLink>
				</div>
			</div>

			<!-- Gallery -->
			<UiGallery
				v-if="(news.imageIds ?? []).length > 0"
				:class="$style.gallery"
				:autoplay="3000"
				loop
			>
				<template
					v-for="(image, index) in news.imageIds"
					:key="index"
					v-slot:[index]
				>
					<img
						:class="$style.galleryImg"
						:src="`/api/images/byGuid?guid=${image}`"
					/>
				</template>
			</UiGallery>

			<!-- Content article -->
			<article :class="$style.article">
				<p :class="$style.content">{{ news.content }}</p>
			</article>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	position: relative;
	min-height: 100dvh;
}

.shader {
	position: absolute;
	inset: 0;
	z-index: 1;
}

.container {
	position: relative;
	z-index: 2;
	max-width: 920px;

	@include container;

	padding: 30px 0 100px;
	display: flex;
	flex-direction: column;
	row-gap: 24px;

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

// Header card
.headerCard {
	padding: 28px;
	border-radius: 12px;
	display: flex;
	flex-direction: column;
	row-gap: 14px;

	@include color-white-bg;
	@include shadow;

	@include respond-to(mobile) {
		padding: 16px;
		row-gap: 12px;
	}
}

.headerTop {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	column-gap: 12px;
	row-gap: 8px;
}

.statusBadge {
	display: inline-flex;
	align-items: center;
	column-gap: 6px;
	padding: 4px 12px;
	border-radius: 100px;

	@include text-xs;

	font-weight: 600;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	width: fit-content;
}

.badgeIcon {
	width: 14px;
	height: 14px;
}

.dateMeta {
	display: flex;
	align-items: center;
	column-gap: 14px;
	flex-wrap: wrap;
	row-gap: 4px;
}

.metaItem {
	display: inline-flex;
	align-items: center;
	column-gap: 4px;

	@include text-s;
	@include color-black(0.55);
}

.metaIcon {
	width: 13px;
	height: 13px;
}

.headerActions {
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
	border: 1px solid rgba($color-black, 0.15);
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

// Moderation panel
.moderatePanel {
	display: flex;
	flex-direction: column;
	row-gap: 10px;
	padding: 14px;
	border-radius: 10px;

	@include color-black-bg(0.03);
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
	background: rgba($color-black, 0.85);

	@include color-white;

	box-shadow: inset 0 0 0 1px $color-black;
}

.moderateFoot {
	display: flex;
	justify-content: flex-end;
	column-gap: 10px;
}

// Title
.title {
	@include reset;
	@include title-l;
	@include color-black;

	line-height: 1.15;

	@include respond-to(mobile) {
		@include title-m;
	}
}

// Author
.authorRow {
	display: flex;
	align-items: center;
}

.authorLink {
	display: flex;
	align-items: center;
	column-gap: 12px;
	text-decoration: none;
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

// Gallery
.gallery {
	height: 440px;
	border-radius: 12px;
	overflow: hidden;

	@include color-black-bg(0.1);
	@include shadow;

	@include respond-to(mobile) {
		height: 260px;
	}

	.galleryImg {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

// Article
.article {
	padding: 28px;
	border-radius: 12px;

	@include color-white-bg;
	@include shadow;

	@include respond-to(mobile) {
		padding: 16px;
	}
}

.content {
	@include reset;
	@include text-m;
	@include color-black;

	font-size: 17px;
	line-height: 1.65;
	white-space: pre-wrap;
}
</style>
