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
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container" v-if="product.name">
			<div
				v-if="isAdmin || isOwner"
				:class="$style.adminTools"
			>
				<UiButton :class="$style.delete" @click="emit('delete')"
					>Удалить</UiButton
				>
				<UiButton :class="$style.edit" @click="emit('edit')"
					>Редактировать</UiButton
				>
			</div>

			<div :class="$style.top">
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

			<div :class="$style.bottom">
				<RouterLink
					v-if="product.owner"
					:to="`/profile/${product.owner.id}`"
				>
					<div :class="$style.owner">
						<img
							:src="`/api/images/byGuid?guid=avatar`"
							:class="$style.image"
						/>
						<div :class="$style.name">
							{{ product.owner.name + " " + product.owner.surname }}
						</div>
					</div>
				</RouterLink>
				<h3 :class="$style.name">{{ product.name }}</h3>
				<p :class="$style.description">{{ product.description }}</p>
				<div :class="$style.price">{{ product.price }} рублей</div>
			</div>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;

		display: flex;
		flex-direction: column;
		row-gap: 30px;

		@include respond-to(mobile) {
			@include container(mobile);

			row-gap: 20px;
		}
	}

	display: flex;
	column-gap: 30px;
	position: relative;

	.adminTools {
		display: flex;
		flex-direction: column;
		row-gap: 10px;

		.delete {
			@include color-error-bg;
		}

		.edit {
			@include color-black-bg(0.08);
		}
	}

	.top {
		width: 100%;
		height: 600px;

		@include respond-to(mobile) {
			height: 280px;
		}

		.gallery {
			@include color-black-bg(0.1);

			height: 100%;
			border-radius: 10px;

			.image {
				width: 100%;
				height: 100%;
				object-fit: contain;
			}
		}
	}

	.bottom {
		display: flex;
		flex-direction: column;
		row-gap: 30px;

		.owner {
			width: fit-content;
			margin-left: auto;
			display: flex;
			align-items: center;
			column-gap: 20px;

			@include respond-to(mobile) {
				margin-left: 0;
			}

			.image {
				width: 50px;
				height: 50px;
				border-radius: 100%;
			}

			.name {
				@include title-m;
			}
		}

		.name {
			@include reset;
			@include title-l;
			@include color-black;

			@include respond-to(mobile) {
				@include title-m;
			}
		}

		.description {
			@include reset;
			@include text-l;
			@include color-black;

			text-indent: 1em;
		}

		.price {
			@include reset;
			@include text-l;
			@include color-black;

			margin-left: auto;

			@include respond-to(mobile) {
				margin-left: 0;
			}
		}
	}
}
</style>
