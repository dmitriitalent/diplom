<script setup lang="ts">
import type { PropType } from "vue";
import type { Order } from "~/entities/Order";
import { useDevice } from "~/composables/device";
import { useCacheStore } from "~/stores/cacheStore";

const props = defineProps({
	order: {
		type: Object as PropType<Order>,
		required: true,
	},
});

const { deviceClassList } = useDevice();
const cacheStore = useCacheStore();

const onClick = () => {
	cacheStore.orders.set({ ...props.order });
};

const formatDate = (iso: string | null | undefined) => {
	if (!iso) return "";
	const d = new Date(iso);
	return d.toLocaleDateString("ru-RU", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
};

const statusLabel = computed(() => {
	if (props.order.status === "open") return "Открыта";
	if (props.order.closeType === "completed") return "Выполнена";
	if (props.order.closeType === "declined") return "Отклонена";
	return "Закрыта";
});
</script>

<template>
	<NuxtLink :to="`/orders/${order.id}`" :class="$style.link" @click="onClick">
		<div :class="[$style.wrapper, ...deviceClassList]">
			<div v-if="order.imageIds?.length" :class="$style.thumb">
				<img
					:class="$style.thumbImg"
					:src="`/api/images/byGuid?guid=${order.imageIds[0]}`"
				/>
			</div>
			<div v-else :class="[$style.thumb, $style.thumbEmpty]">
				<Icon
					name="mdi:clipboard-text-outline"
					:class="$style.thumbIcon"
				/>
			</div>

			<div :class="$style.body">
				<div :class="$style.top">
					<h3 :class="$style.title">
						<span :class="$style.idTag">#{{ order.id }}</span>
						{{ order.type }}
					</h3>
					<span
						:class="[
							$style.badge,
							order.status === 'open'
								? $style.badge_open
								: order.closeType === 'completed'
									? $style.badge_completed
									: $style.badge_declined,
						]"
					>
						{{ statusLabel }}
					</span>
				</div>

				<p :class="$style.description">{{ order.description }}</p>

				<div :class="$style.footer">
					<div :class="$style.meta">
						<span v-if="order.createdAt" :class="$style.metaItem">
							<Icon
								name="mdi:calendar-outline"
								:class="$style.metaIcon"
							/>
							{{ formatDate(order.createdAt) }}
						</span>
						<span v-if="order.closedAt" :class="$style.metaItem">
							<Icon
								name="mdi:calendar-check-outline"
								:class="$style.metaIcon"
							/>
							{{ formatDate(order.closedAt) }}
						</span>
						<span v-if="order.imageIds?.length" :class="$style.metaItem">
							<Icon
								name="mdi:image-outline"
								:class="$style.metaIcon"
							/>
							{{ order.imageIds.length }}
						</span>
					</div>

					<div v-if="order.author" :class="$style.author">
						<Icon
							name="mdi:account-outline"
							:class="$style.authorIcon"
						/>
						{{ order.author.name }} {{ order.author.surname }}
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
	@include shadow;

	width: 100%;
	display: flex;
	column-gap: 16px;
	border-radius: 12px;
	overflow: hidden;
	transition: background-color $transition-fast;

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
		height: 130px;
		border-radius: 12px;
		overflow: hidden;
		flex-shrink: 0;

		@include respond-to(mobile) {
			width: 100%;
			min-width: 0;
			height: 200px;
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
		column-gap: 8px;

		.title {
			@include reset;
			@include title-s;
			@include color-black;

			flex: 1;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;

			.idTag {
				opacity: 0.4;
				margin-right: 6px;
			}
		}
	}

	.badge {
		@include text-s;

		flex-shrink: 0;
		padding: 2px 8px;
		border-radius: 100px;
		font-size: 11px;
		white-space: nowrap;

		&.badge_open {
			@include color-warn-bg;
		}
		&.badge_completed {
			@include color-success-bg;
		}
		&.badge_declined {
			@include color-error-bg;
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
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
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

	.author {
		@include text-s;
		@include color-black;

		display: flex;
		align-items: center;
		column-gap: 4px;
		opacity: 0.45;
		font-size: 12px;
		white-space: nowrap;

		.authorIcon {
			width: 13px;
			height: 13px;
		}
	}
}
</style>
