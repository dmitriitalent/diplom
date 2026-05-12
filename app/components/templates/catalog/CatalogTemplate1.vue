<script setup lang="ts">
import type { Cached } from "~/stores/cacheStore";
import type { Product } from "~/entities/Product";
import { useDevice } from "~/composables/device";

const props = defineProps<{
	product: Cached<Product>;
	isAdmin: boolean;
	isOwner: boolean;
}>();

const emit = defineEmits<{
	(e: "delete"): void;
	(e: "edit"): void;
}>();

const { deviceClassList } = useDevice();

const isFree = computed(() => props.product.price === 0);

const priceLabel = computed(() => {
	if (isFree.value) return "Бесплатно";
	if (props.product.price == null) return "";
	return new Intl.NumberFormat("ru-RU").format(props.product.price) + " ₽";
});

const statusBadge = computed(() => {
	const map: Record<
		string,
		{ bg: string; color: string; label: string; icon: string }
	> = {
		active: {
			bg: "#efffde",
			color: "#1c5b1c",
			label: "В продаже",
			icon: "mdi:check-circle-outline",
		},
		reserved: {
			bg: "#fff3c8",
			color: "#7a5a00",
			label: "Забронирован",
			icon: "mdi:bookmark-outline",
		},
		sold: {
			bg: "rgba(38,28,7,0.08)",
			color: "rgba(38,28,7,0.65)",
			label: "Продан",
			icon: "mdi:archive-outline",
		},
		pending: {
			bg: "#fff3c8",
			color: "#7a5a00",
			label: "На проверке",
			icon: "mdi:clock-outline",
		},
	};
	return map[(props.product as any).status ?? "active"] ?? map.active;
});

const publishedAt = computed(() => {
	const ts = (props.product as any).publishedAt ?? props.product.createdAt;
	if (!ts) return "";
	return new Date(ts).toLocaleString("ru-RU", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
});

const updatedAt = computed(() => {
	const ts = (props.product as any).updatedAt;
	const pub = (props.product as any).publishedAt ?? props.product.createdAt;
	if (!ts || ts === pub) return "";
	return new Date(ts).toLocaleString("ru-RU", {
		day: "2-digit",
		month: "long",
	});
});

const ownerRoom = computed(() => {
	const o = props.product.owner;
	if (!o) return "";
	const parts: string[] = [];
	if ((o as any).building) parts.push("корп. " + (o as any).building);
	if ((o as any).room) parts.push("комн. " + (o as any).room);
	return parts.join(" · ");
});
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<!-- Breadcrumbs -->
			<div :class="$style.crumbs">
				<RouterLink to="/catalog" :class="$style.crumbLink"
					>Каталог</RouterLink
				>
				<Icon name="mdi:chevron-right" :class="$style.crumbSep" />
				<span :class="$style.crumbCurrent">{{ product.name }}</span>
			</div>

			<div :class="$style.grid">
				<!-- Left -->
				<div :class="$style.left">
					<!-- Gallery -->
					<UiGallery
						v-if="(product.images ?? []).length > 0"
						:class="$style.gallery"
						:autoplay="3000"
						loop
					>
						<template
							v-for="(image, index) in product.images"
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
						<h2 :class="$style.articleTitle">Описание</h2>
						<p :class="$style.articleText">
							{{ product.description }}
						</p>
					</article>

					<!-- Safe deal note -->
					<div :class="$style.safeDeal">
						<Icon
							name="mdi:shield-check-outline"
							:class="$style.safeDealIcon"
						/>
						<div :class="$style.safeDealText">
							<span :class="$style.safeDealTitle"
								>Сделка между соседями</span
							>
							<span :class="$style.safeDealDesc">
								Договаривайтесь о встрече в холле, на этаже или
								в комнате. Деньги передавайте лично — Hostelite
								не проводит платежи.
							</span>
						</div>
					</div>
				</div>

				<!-- Right: sticky sidebar -->
				<aside :class="$style.sidebar">
					<div :class="$style.sideTop">
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
						<div
							v-if="isAdmin || isOwner"
							:class="$style.ownerBtns"
						>
							<button
								:class="$style.chipBtn"
								@click="emit('edit')"
							>
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

					<h1 :class="$style.name">{{ product.name }}</h1>

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
							Отдаю даром
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
						v-if="product.owner"
						:class="[$style.sideRow, $style.sideRowBorder]"
					>
						<RouterLink
							:to="`/profile/${product.owner.id}`"
							:class="$style.authorLink"
						>
							<img
								:src="`/api/images/byGuid?guid=avatar`"
								:class="$style.authorAvatar"
							/>
							<div :class="$style.authorInfo">
								<span :class="$style.authorName">
									{{ product.owner.name }}
									{{ product.owner.surname }}
								</span>
								<span
									v-if="ownerRoom"
									:class="$style.authorSub"
									>{{ ownerRoom }}</span
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
							Написать продавцу
						</UiButton>
						<UiButton>
							<Icon
								name="mdi:bookmark-outline"
								:class="$style.btnIcon"
							/>
							Забронировать
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

	// Safe deal
	.safeDeal {
		display: flex;
		align-items: flex-start;
		column-gap: 14px;
		padding: 20px;
		border-radius: 12px;
		background: rgba(255, 241, 191, 0.5);
	}

	.safeDealIcon {
		@include color-black;

		width: 28px;
		height: 28px;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.safeDealText {
		display: flex;
		flex-direction: column;
		row-gap: 4px;
	}

	.safeDealTitle {
		@include text-m;
		@include color-black;

		font-weight: 600;
	}

	.safeDealDesc {
		@include text-s;
		@include color-black(0.7);

		line-height: 1.5;
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
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
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
