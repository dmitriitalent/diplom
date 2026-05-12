<script setup lang="ts">
defineProps<{
	service: {
		id: string;
		name: string;
		description?: string;
		price?: number;
	};
}>();

const formatPrice = (p?: number) => {
	if (p == null) return "";
	return new Intl.NumberFormat("ru-RU").format(p) + " ₽";
};
</script>

<template>
	<div :class="$style.card">
		<div :class="$style.head">
			<div :class="$style.iconBox">
				<Icon name="mdi:tools" :class="$style.headIcon" />
			</div>
			<h4 :class="$style.title">{{ service.name }}</h4>
		</div>
		<p :class="$style.text">{{ service.description }}</p>
		<div :class="$style.price">{{ formatPrice(service.price) }}</div>
	</div>
</template>

<style module lang="scss">
.card {
	@include color-white-bg(0.72);
	@include shadow;

	width: 100%;
	min-height: 180px;
	padding: 18px;
	border-radius: 12px;
	backdrop-filter: blur(12px);
	display: flex;
	flex-direction: column;
	row-gap: 12px;
	box-sizing: border-box;
}

.head {
	display: flex;
	align-items: center;
	column-gap: 12px;
}

.iconBox {
	@include color-accent-bg;

	width: 40px;
	height: 40px;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.headIcon {
	@include color-black;

	width: 22px;
	height: 22px;
}

.title {
	@include reset;
	@include title-xs;
	@include color-black;
}

.text {
	@include reset;
	@include text-s;
	@include color-black(0.7);

	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.price {
	@include title-xs;
	@include color-black;

	margin-top: auto;
}
</style>
