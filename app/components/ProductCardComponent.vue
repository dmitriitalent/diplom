<script setup lang="ts">
defineProps<{
	product: {
		id: string;
		name: string;
		price?: number;
		images?: Array<{ fileGuid: string; sortOrder: number }>;
	};
}>();

const formatPrice = (p?: number) => {
	if (p == null) return "";
	return new Intl.NumberFormat("ru-RU").format(p);
};
</script>

<template>
	<div :class="$style.card">
		<div :class="$style.image">
			<UiImage
				v-if="product.images?.[0]?.fileGuid"
				:src="`/api/images/byGuid?guid=${product.images[0].fileGuid}`"
				:class="$style.img"
			/>
			<Icon
				v-else
				name="mdi:image-outline"
				:class="$style.imgFallback"
			/>
		</div>
		<h4 :class="$style.name">{{ product.name }}</h4>
		<div :class="$style.foot">
			<span v-if="product.price != null" :class="$style.price">
				{{ formatPrice(product.price) }}
				<span :class="$style.currency">₽</span>
			</span>
		</div>
	</div>
</template>

<style module lang="scss">
.card {
	@include color-white-bg(0.72);
	@include shadow;

	width: 100%;
	min-height: 250px;
	padding: 14px;
	border-radius: 12px;
	backdrop-filter: blur(12px);
	display: flex;
	flex-direction: column;
	row-gap: 10px;
	box-sizing: border-box;

	@include respond-to(mobile) {
		min-height: 220px;
	}
}

.image {
	height: 140px;
	border-radius: 8px;
	background: rgba($color-black, 0.06);
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;

	@include respond-to(mobile) {
		height: 110px;
	}
}

.img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.imgFallback {
	@include color-black(0.35);

	width: 48px;
	height: 48px;
}

.name {
	@include reset;
	@include text-m;
	@include color-black;

	font-weight: 600;
}

.foot {
	margin-top: auto;
}

.price {
	@include title-xs;
	@include color-black;

	.currency {
		font-family: Roboto;
		font-weight: 300;
		font-size: 14px;
	}
}
</style>
