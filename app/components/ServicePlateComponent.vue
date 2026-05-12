<script setup lang="ts">
import type { PropType } from "vue";
import type { Service } from "~/entities/Service";
import { useDevice } from "~/composables/device";
import { useCacheStore } from "~/stores/cacheStore";

const props = defineProps({
	service: {
		type: Object as PropType<Service>,
		required: true,
	},
});

const { deviceClassList } = useDevice();
const cacheStore = useCacheStore();

const onClick = () => {
	cacheStore.services.set({ ...props.service });
};
</script>

<template>
	<RouterLink
		:to="`/services/${service.id}`"
		:class="$style.link"
		@click="onClick"
	>
		<div
			:class="[
				$style.wrapper,
				'ServicePlateComponent',
				...deviceClassList,
			]"
		>
			<div :class="$style.left">
				<UiGallery :class="$style.gallery" :autoplay="3000" loop>
					<template
						v-for="(image, index) in service.images"
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
				<h3 :class="$style.name">{{ service.name }}</h3>
				<p :class="$style.description">{{ service.description }}</p>
				<div :class="$style.bottom">
					<span :class="$style.owner">
						{{ service.owner.name }} {{ service.owner.surname }}
					</span>
					<span :class="$style.price"
						>{{ service.price }}
						<span :class="$style.currency">₽</span>
					</span>
				</div>
			</div>
		</div>
	</RouterLink>
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
	height: 220px;
	display: flex;
	column-gap: 30px;
	position: relative;
	border-radius: 10px;
	overflow: hidden;

	transition: $transition-fast;

	&:hover {
		@include color-white-bg;
	}

	@include respond-to(mobile) {
		height: auto;
		flex-direction: column;
		column-gap: 0;
	}

	.left {
		min-width: 300px;
		max-width: 300px;
		height: 100%;

		@include respond-to(mobile) {
			min-width: 0;
			max-width: none;
			width: 100%;
			height: 200px;
		}

		.gallery {
			height: 100%;
			border-radius: 0;

			.image {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}
	}

	.right {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 20px 20px 20px 0;
		row-gap: 10px;
		overflow: hidden;

		@include respond-to(mobile) {
			padding: 14px 16px 16px;
		}

		.name {
			@include reset;
			@include title-m;
			@include color-black;
		}

		.description {
			@include reset;
			@include text-m;
			@include color-black;

			flex: 1;
			overflow: hidden;
			display: -webkit-box;
			-webkit-line-clamp: 4;
			-webkit-box-orient: vertical;
			opacity: 0.7;
		}

		.bottom {
			display: flex;
			justify-content: space-between;
			align-items: center;

			.owner {
				@include text-s;
				@include color-black;

				opacity: 0.5;
			}

			.price {
				@include title-m;
				@include color-black;

				.currency {
					font-family: Roboto;
					font-weight: 300;
					font-size: 20px;
				}
			}
		}
	}
}
</style>
