<script setup lang="ts">
import type { Cached } from "~/stores/cacheStore";
import type { Service, ServiceComment } from "~/entities/Service";
import { useDevice } from "~/composables/device";
import { useSelfStore } from "~/stores/selfStore";

const props = defineProps<{
	service: Cached<Service>;
	isAdmin: boolean;
	isOwner: boolean;
}>();

const emit = defineEmits<{
	(e: "delete"): void;
	(e: "edit"): void;
	(e: "add-comment", body: string): void;
}>();

const { deviceClassList } = useDevice();
const { self } = useSelfStore();

const comments = computed<ServiceComment[]>(() => props.service.comments ?? []);

const commentBody = ref("");
const submittingComment = ref(false);

const submitComment = async () => {
	if (!commentBody.value.trim() || submittingComment.value) return;
	submittingComment.value = true;
	try {
		emit("add-comment", commentBody.value);
		commentBody.value = "";
	} finally {
		submittingComment.value = false;
	}
};

const statusBadge = computed(() => {
	const map: Record<
		string,
		{ bg: string; color: string; label: string; icon: string }
	> = {
		active: {
			bg: "#efffde",
			color: "#1c5b1c",
			label: "Доступна",
			icon: "mdi:check-circle-outline",
		},
		paused: {
			bg: "rgba(38,28,7,0.08)",
			color: "rgba(38,28,7,0.65)",
			label: "Приостановлена",
			icon: "mdi:pause-circle-outline",
		},
		pending: {
			bg: "#fff3c8",
			color: "#7a5a00",
			label: "На проверке",
			icon: "mdi:clock-outline",
		},
	};
	return map[(props.service as any).status ?? "active"] ?? map.active;
});

const categoryLabel = computed(
	() => (props.service as any).category ?? "Услуга",
);

const priceLabel = computed(() => {
	if (props.service.price == null) return "";
	if (props.service.price === 0) return "Бесплатно";
	return (
		"от " +
		new Intl.NumberFormat("ru-RU").format(props.service.price) +
		" ₽"
	);
});

const isFree = computed(() => props.service.price === 0);

const publishedAt = computed(() => {
	const ts = (props.service as any).publishedAt ?? props.service.createdAt;
	if (!ts) return "";
	return new Date(ts).toLocaleString("ru-RU", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
});

const updatedAt = computed(() => {
	const ts = (props.service as any).updatedAt;
	const pub = (props.service as any).publishedAt ?? props.service.createdAt;
	if (!ts || ts === pub) return "";
	return new Date(ts).toLocaleString("ru-RU", {
		day: "2-digit",
		month: "long",
	});
});

const ownerRoom = computed(() => {
	const o = props.service.owner;
	if (!o) return "";
	const parts: string[] = [];
	if ((o as any).building) parts.push("корп. " + (o as any).building);
	if ((o as any).room) parts.push("комн. " + (o as any).room);
	return parts.join(" · ");
});

const isMyComment = (comment: ServiceComment) => {
	return self?.id === comment.authorId;
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<ShaderComponent :class="$style.shader" />
		<div :class="$style.container">
			<!-- Breadcrumbs -->
			<div :class="$style.crumbs">
				<RouterLink to="/services" :class="$style.crumbLink"
					>Услуги</RouterLink
				>
				<Icon name="mdi:chevron-right" :class="$style.crumbSep" />
				<span :class="$style.crumbCurrent">{{ service.name }}</span>
			</div>

			<div :class="$style.grid">
				<!-- Left column -->
				<div :class="$style.left">
					<!-- Gallery -->
					<UiGallery
						v-if="(service.images ?? []).length > 0"
						:class="$style.gallery"
						:autoplay="3000"
						loop
					>
						<template
							v-for="(image, index) in service.images"
							:key="index"
							v-slot:[index]
						>
							<img
								:class="$style.galleryImg"
								:src="`/api/images/byGuid?guid=${image.fileGuid}`"
							/>
						</template>
					</UiGallery>
					<div v-else :class="$style.galleryEmpty">
						<Icon
							name="mdi:image-outline"
							:class="$style.galleryEmptyIcon"
						/>
					</div>

					<!-- Description -->
					<article :class="$style.article">
						<h2 :class="$style.articleTitle">Описание услуги</h2>
						<p :class="$style.articleText">
							{{ service.description }}
						</p>
					</article>

					<!-- Comments -->
					<section :class="$style.comments">
						<h2 :class="$style.commentsTitle">Вопросы и отзывы</h2>

						<div
							v-for="comment in comments"
							:key="comment.id"
							:class="$style.comment"
						>
							<div :class="$style.commentHeader">
								<RouterLink
									:to="`/profile/${comment.authorId}`"
									:class="$style.commentAuthorLink"
								>
									<img
										:src="`/api/images/byGuid?guid=avatar`"
										:class="$style.commentAvatar"
									/>
									<div :class="$style.commentAuthorInfo">
										<span :class="$style.commentAuthorName">
											{{ comment.author?.name }}
											{{ comment.author?.surname }}
										</span>
										<span :class="$style.commentDate">
											{{
												new Date(
													comment.publishedAt,
												).toLocaleString("ru-RU", {
													day: "2-digit",
													month: "long",
													year: "numeric",
												})
											}}
										</span>
									</div>
								</RouterLink>
								<span
									v-if="isMyComment(comment)"
									:class="$style.myBadge"
									>Мой отзыв</span
								>
								<span
									v-else-if="
										comment.authorId === service.owner?.id
									"
									:class="$style.ownerBadge"
								>
									<Icon
										name="mdi:tools"
										:class="$style.ownerBadgeIcon"
									/>
									Исполнитель
								</span>
							</div>
							<p :class="$style.commentBody">
								{{ comment.body }}
							</p>
						</div>

						<div
							v-if="comments.length === 0"
							:class="$style.noComments"
						>
							<Icon
								name="mdi:comment-outline"
								:class="$style.noCommentsIcon"
							/>
							Вопросов и отзывов пока нет
						</div>

						<div :class="$style.addComment">
							<UiTextarea
								v-model="commentBody"
								:rows="3"
								placeholder="Задайте вопрос или оставьте отзыв..."
								:class="$style.commentInput"
							/>
							<UiButton
								accent
								:disabled="
									submittingComment || !commentBody.trim()
								"
								@click="submitComment"
							>
								{{
									submittingComment
										? "Отправка..."
										: "Отправить"
								}}
							</UiButton>
						</div>
					</section>
				</div>

				<!-- Right: sticky sidebar -->
				<aside :class="$style.sidebar">
					<div :class="$style.sideTop">
						<span :class="$style.categoryBadge">
							<Icon
								name="mdi:tools"
								:class="$style.categoryIcon"
							/>
							{{ categoryLabel }}
						</span>
						<span
							:class="$style.statusBadge"
							:style="{
								background: statusBadge.bg,
								color: statusBadge.color,
							}"
						>
							<Icon
								:name="statusBadge.icon"
								:class="$style.badgeIcon"
							/>
							{{ statusBadge.label }}
						</span>
					</div>

					<div v-if="isAdmin || isOwner" :class="$style.ownerBtns">
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

					<h1 :class="$style.name">{{ service.name }}</h1>

					<!-- Price -->
					<div :class="$style.priceBlock">
						<span
							:class="[$style.price, isFree && $style.priceFree]"
							>{{ priceLabel }}</span
						>
						<span v-if="isFree" :class="$style.freeTag">
							<Icon
								name="mdi:gift-outline"
								:class="$style.freeTagIcon"
							/>
							Бесплатно
						</span>
					</div>

					<!-- Location -->
					<div :class="$style.sideRow">
						<div :class="$style.sideIconBox">
							<Icon
								name="mdi:map-marker-outline"
								:class="$style.sideIcon"
							/>
						</div>
						<div :class="$style.sideInfo">
							<span :class="$style.sideInfoMain"
								>Встреча в общежитии</span
							>
						</div>
					</div>

					<!-- Owner -->
					<div
						v-if="service.owner"
						:class="[$style.sideRow, $style.sideRowBorder]"
					>
						<RouterLink
							:to="`/profile/${service.owner.id}`"
							:class="$style.authorLink"
						>
							<img
								:src="`/api/images/byGuid?guid=avatar`"
								:class="$style.authorAvatar"
							/>
							<div :class="$style.authorInfo">
								<span :class="$style.authorName">
									{{ service.owner.name }}
									{{ service.owner.surname }}
								</span>
								<span
									v-if="ownerRoom"
									:class="$style.authorSub"
									>{{ ownerRoom }}</span
								>
								<span :class="$style.authorRole"
									>Исполнитель</span
								>
							</div>
						</RouterLink>
					</div>

					<!-- CTA -->
					<div :class="[$style.cta, $style.sideRowBorder]">
						<UiButton accent>
							<Icon
								name="mdi:message-text-outline"
								:class="$style.btnIcon"
							/>
							Написать исполнителю
						</UiButton>
						<UiButton>
							<Icon
								name="mdi:bookmark-outline"
								:class="$style.btnIcon"
							/>
							Сохранить
						</UiButton>
					</div>

					<!-- Meta -->
					<div :class="[$style.metaBlock, $style.sideRowBorder]">
						<span v-if="publishedAt" :class="$style.metaItem">
							<Icon
								name="mdi:calendar-outline"
								:class="$style.metaIcon"
							/>
							опубликовано {{ publishedAt }}
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

	.shader {
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	.container {
		position: relative;
		z-index: 2;

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

	// Grid
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

	.galleryEmpty {
		height: 440px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;

		@include color-black-bg(0.06);

		@include respond-to(mobile) {
			height: 200px;
		}
	}

	.galleryEmptyIcon {
		@include color-black(0.3);

		width: 80px;
		height: 80px;
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

	// Comments
	.comments {
		padding: 28px;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		row-gap: 20px;

		@include color-white-bg;
		@include shadow;

		@include respond-to(mobile) {
			padding: 16px;
			row-gap: 16px;
		}
	}

	.commentsTitle {
		@include reset;
		@include title-s;
		@include color-black;
	}

	.comment {
		display: flex;
		flex-direction: column;
		row-gap: 10px;
		padding: 16px;
		border-radius: 10px;

		@include color-black-bg(0.03);
	}

	.commentHeader {
		display: flex;
		align-items: center;
		justify-content: space-between;
		column-gap: 10px;
		flex-wrap: wrap;
		row-gap: 8px;
	}

	.commentAuthorLink {
		display: flex;
		align-items: center;
		column-gap: 10px;
		text-decoration: none;
	}

	.commentAvatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		flex-shrink: 0;
		background: #fff1bf;
	}

	.commentAuthorInfo {
		display: flex;
		flex-direction: column;
	}

	.commentAuthorName {
		@include text-m;
		@include color-black;

		font-weight: 600;
	}

	.commentDate {
		@include text-s;
		@include color-black(0.45);
	}

	.myBadge {
		display: inline-flex;
		align-items: center;
		padding: 3px 10px;
		border-radius: 100px;
		background: rgba(38, 28, 7, 0.07);

		@include text-xs;
		@include color-black(0.55);

		font-weight: 600;
	}

	.ownerBadge {
		display: inline-flex;
		align-items: center;
		column-gap: 5px;
		padding: 3px 10px;
		border-radius: 100px;
		background: #fff3c8;
		color: #7a5a00;

		@include text-xs;

		font-weight: 600;
	}

	.ownerBadgeIcon {
		width: 12px;
		height: 12px;
	}

	.commentBody {
		@include reset;
		@include text-m;
		@include color-black;

		line-height: 1.6;
	}

	.noComments {
		display: flex;
		flex-direction: column;
		align-items: center;
		row-gap: 10px;
		padding: 32px 0;

		@include text-m;
		@include color-black(0.4);
	}

	.noCommentsIcon {
		width: 40px;
		height: 40px;
		opacity: 0.35;
	}

	.addComment {
		display: flex;
		flex-direction: column;
		row-gap: 10px;
		padding-top: 8px;
		border-top: 1px solid rgba($color-black, 0.08);
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

	.sideTop {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
	}

	.categoryBadge {
		display: inline-flex;
		align-items: center;
		column-gap: 5px;
		padding: 4px 12px;
		border-radius: 100px;
		background: rgba(38, 28, 7, 0.07);

		@include text-xs;
		@include color-black(0.65);

		font-weight: 600;
		letter-spacing: 0.03em;
	}

	.categoryIcon {
		width: 12px;
		height: 12px;
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
	}

	.badgeIcon {
		width: 14px;
		height: 14px;
	}

	.ownerBtns {
		display: flex;
		column-gap: 8px;
		flex-wrap: wrap;
		row-gap: 6px;
	}

	.chipBtn {
		display: inline-flex;
		align-items: center;
		column-gap: 6px;
		padding: 6px 10px;
		border-radius: 8px;
		background: transparent;
		border: 1px solid rgba($color-black, 0.15);
		cursor: pointer;

		@include text-xs;
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
		width: 13px;
		height: 13px;
	}

	// Name
	.name {
		@include reset;
		@include title-m;
		@include color-black;

		line-height: 1.2;
	}

	// Price
	.priceBlock {
		display: flex;
		align-items: baseline;
		column-gap: 10px;
		padding: 12px 0;
		border-top: 1px solid rgba($color-black, 0.08);
		border-bottom: 1px solid rgba($color-black, 0.08);
	}

	.price {
		@include title-l;
		@include color-black;

		line-height: 1;
	}

	.priceFree {
		color: #1c5b1c;
	}

	.freeTag {
		display: inline-flex;
		align-items: center;
		column-gap: 4px;
		padding: 3px 10px;
		border-radius: 100px;
		background: #efffde;
		color: #1c5b1c;

		@include text-xs;

		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.freeTagIcon {
		width: 12px;
		height: 12px;
	}

	// Side rows
	.sideRow {
		display: flex;
		align-items: center;
		column-gap: 12px;
	}

	.sideRowBorder {
		padding-top: 12px;
		border-top: 1px solid rgba($color-black, 0.08);
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
	}

	.sideInfoMain {
		@include text-m;
		@include color-black;

		font-weight: 600;
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

	.authorSub {
		@include text-s;
		@include color-black(0.55);
	}

	.authorRole {
		@include text-xs;

		color: #7a5a00;
		font-weight: 600;
	}

	// CTA
	.cta {
		display: flex;
		flex-direction: column;
		row-gap: 8px;
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
