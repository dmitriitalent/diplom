<script setup lang="ts">
import type { PropType } from "vue";
import type { Product } from "~/entities/Product";
import { useDevice } from "~/composables/device";
import { useCacheStore } from "~/stores/cacheStore";

const props = defineProps({
	product: {
		type: Object as PropType<Product>,
		required: true,
	},
});

const { deviceClassList } = useDevice();
const cacheStore = useCacheStore();

const onClick = () => {
	cacheStore.products.set({ ...props.product });
};

const formatPrice = (price: number) => price.toLocaleString("ru-RU");

const formatDate = (iso: string) => {
	const d = new Date(iso);
	return d.toLocaleDateString("ru-RU", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

const statusLabel: Record<string, string> = {
	active: "Активно",
	sold: "Продано",
	archived: "В архиве",
	pending: "На проверке",
};
</script>

<template>
	<NuxtLink
		:to="`/catalog/${product.id}`"
		:class="$style.link"
		@click="onClick"
	>
		<div :class="[$style.wrapper, ...deviceClassList]">
			<div v-if="product.images?.length" :class="$style.thumb">
				<img
					:class="$style.thumbImg"
					:src="`/api/images/byGuid?guid=${product.images[0].fileGuid}`"
				/>
				<span
					v-if="product.images.length > 1"
					:class="$style.imageCount"
				>
					+{{ product.images.length - 1 }}
				</span>
			</div>
			<div v-else :class="[$style.thumb, $style.thumbEmpty]">
				<Icon name="mdi:image-outline" :class="$style.thumbIcon" />
			</div>

			<div :class="$style.body">
				<div :class="$style.top">
					<h3 :class="$style.title">{{ product.name }}</h3>
					<span :class="$style.price">
						{{ formatPrice(product.price) }}
						<span :class="$style.currency">₽</span>
					</span>
				</div>

				<p :class="$style.description">{{ product.description }}</p>

				<div :class="$style.footer">
					<div :class="$style.meta">
						<span
							v-if="product.category?.name"
							:class="$style.metaItem"
						>
							<Icon
								name="mdi:tag-outline"
								:class="$style.metaIcon"
							/>
							{{ product.category.name }}
						</span>
						<span
							v-if="product.publishedAt"
							:class="$style.metaItem"
						>
							<Icon
								name="mdi:calendar-outline"
								:class="$style.metaIcon"
							/>
							{{ formatDate(product.publishedAt) }}
						</span>
						<span
							v-if="product.status && product.status !== 'active'"
							:class="[
								$style.badge,
								$style['badge_' + product.status],
							]"
						>
							{{ statusLabel[product.status] ?? product.status }}
						</span>
					</div>

					<div :class="$style.owner">
						<Icon
							name="mdi:account-outline"
							:class="$style.ownerIcon"
						/>
						{{ product.owner?.name }} {{ product.owner?.surname }}
					</div>
				</div>
			</div>
		</div>
	</NuxtLink>
</template>

<style module lang="scss">
.link {
	text-decoration: none;
	color: inherit;
	display: block;
}

.wrapper {
	@include color-white-bg(0.72);
	width: 100%;
	display: flex;
	column-gap: 16px;
	border-radius: 12px;
	overflow: hidden;
	transition: background-color $transition-fast;

	@include shadow;

	&:hover {
		@include color-white-bg;
	}

	@include respond-to(mobile) {
		flex-direction: column;
		column-gap: 0;
	}

	.thumb {
		width: 160px;
		min-width: 160px;
		height: 140px;
		border-radius: 12px;
		overflow: hidden;
		flex-shrink: 0;
		position: relative;

		@include respond-to(mobile) {
			width: 100%;
			min-width: 0;
			height: 240px;
			border-radius: 0;
		}

		.thumbImg {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.thumbEmpty {
		@include color-black-bg(0.06);

		display: flex;
		align-items: center;
		justify-content: center;

		.thumbIcon {
			width: 36px;
			height: 36px;
			opacity: 0.25;
		}
	}

	.imageCount {
		@include text-s;

		position: absolute;
		bottom: 6px;
		right: 8px;
		background: rgba(0, 0, 0, 0.5);
		color: #fff;
		border-radius: 100px;
		padding: 1px 6px;
		font-size: 11px;
	}

	.body {
		flex: 1;
		min-width: 0;
		padding: 14px 16px 14px 0;
		display: flex;
		flex-direction: column;
		row-gap: 6px;

		@include respond-to(mobile) {
			padding: 12px 14px 14px;
		}
	}

	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		column-gap: 12px;

		.title {
			@include reset;
			@include title-s;
			@include color-black;

			flex: 1;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.price {
			@include title-s;
			@include color-black;

			flex-shrink: 0;
			white-space: nowrap;

			.currency {
				font-family: Roboto;
				font-weight: 300;
				font-size: 16px;
			}
		}
	}

	.description {
		@include reset;
		@include text-s;
		@include color-black;

		opacity: 0.6;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-height: 1.4;
		flex: 1;
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: auto;

		@include respond-to(mobile) {
			flex-wrap: wrap;
			row-gap: 4px;
		}
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		column-gap: 12px;
		row-gap: 2px;
	}

	.metaItem {
		@include text-s;
		@include color-black;

		display: flex;
		align-items: center;
		column-gap: 3px;
		opacity: 0.5;
		font-size: 12px;

		.metaIcon {
			width: 13px;
			height: 13px;
		}
	}

	.badge {
		@include text-s;

		padding: 2px 8px;
		border-radius: 100px;
		font-size: 11px;

		&.badge_sold {
			@include color-success-bg;
		}
		&.badge_archived {
			@include color-black-bg(0.08);
		}
		&.badge_pending {
			@include color-warn-bg;
		}
	}

	.owner {
		@include text-s;
		@include color-black;

		display: flex;
		align-items: center;
		column-gap: 4px;
		opacity: 0.45;
		font-size: 12px;
		white-space: nowrap;

		.ownerIcon {
			width: 13px;
			height: 13px;
		}
	}
}
</style>
