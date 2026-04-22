<script setup lang="ts">
import type { PropType } from "vue";
import type { Activity } from "~/entities/Activity";

const props = defineProps({
	activity: {
		type: Object as PropType<Activity>,
		required: true,
	},
});
</script>

<template>
	<div
		:class="[
			$style.wrapper,
			'NewsPlateComponent',
			activity.moderationStatus == 'pending' ? '--is-pending' : '',
		]"
	>
		<div :class="$style.left">
			<UiGallery :class="$style.gallery" :autoplay="3000" loop>
				<template
					v-for="(image, index) in activity.imageIds"
					:key="index"
					v-slot:[index]
				>
					<img
						:class="$style.image"
						:src="`/api/images/byGuid?guid=${image}`"
					/>
				</template>
			</UiGallery>
		</div>

		<div :class="$style.right">
			<h3 :class="$style.name">{{ activity.title }}</h3>
			<p :class="$style.description">{{ activity.description }}</p>
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
	border-radius: 10px;

	&:global(.--is-pending) {
		@include color-warn-bg(0.8);
	}

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
