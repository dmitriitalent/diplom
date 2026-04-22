<script setup lang="ts">
import type { PropType } from "vue";
import type { Product } from "~/entities/Product";

const props = defineProps({
	product: {
		type: Object as PropType<Product>,
		required: true,
	},
});
</script>

<template>
	<div :class="[$style.wrapper, 'ProductPlateComponent']">
		<div :class="$style.left">
			<UiGallery :class="$style.gallery" :autoplay="3000" loop>
				<template
					v-for="(image, index) in product.images"
					:key="index"
					v-slot:[index]
				>
					<img
						:class="$style.image"
						:src="`/api/images/byGuid?guid=${image.fileGuid}`"
					/>
				</template>
			</UiGallery>
		</div>

		<div :class="$style.right">
			<h3 :class="$style.name">{{ product.name }}</h3>
			<p :class="$style.description">{{ product.description }}</p>
			<div :class="$style.price">{{ product.price }}</div>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	width: 100%;
	height: 400px;
	display: flex;
	column-gap: 30px;
	position: relative;

	.left {
		min-width: 500px;
		max-width: 500px;
		height: 100%;

		.gallery {
			height: 100%;
			border-radius: 10px;

			.image {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}
	}

	.right {
		.name {
			@include reset;
			@include title-l;
			@include color-black;
		}

		.description {
			@include reset;
			@include text-l;
			@include color-black;
		}

		.price {
			@include reset;
			@include text-l;
			@include color-black;

			position: absolute;
			bottom: 20px;
			right: 20px;
		}
	}
}
</style>
