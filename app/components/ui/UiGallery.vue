<script setup lang="ts">
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import { useSlots } from "vue";
import "swiper/css";

const props = defineProps({
	loop: {
		type: Boolean,
		default: false,
	},

	slidesPerView: {
		type: Number,
		default: 1,
	},

	spaceBetween: {
		type: Number,
		default: 20,
	},

	autoplay: {
		type: Number,
	},

	innerShadow: {
		type: Boolean,
	},

	speed: {
		type: Number,
		default: 600,
	},
});

const autoplaySettigs = props.autoplay
	? { delay: props.autoplay, pauseOnMouseEnter: true }
	: false;

const slots = Object.keys(useSlots());

const classList = computed(() => {
	return [{ ["--has-inner-shadow"]: props.innerShadow }];
});
</script>

<template>
	<ClientOnly>
		<Swiper
			:speed="speed"
			:modules="[Autoplay]"
			:loop="props.loop"
			:autoplay="autoplaySettigs"
			:slides-per-view="props.slidesPerView"
			:space-between="props.spaceBetween"
			:class="[...classList, $style.wrapper]"
		>
			<SwiperSlide
				v-for="name in slots"
				:key="name"
				:class="[...classList, $style.slide]"
			>
				<slot :name="name" />
			</SwiperSlide>
		</Swiper>
	</ClientOnly>
</template>

<style module lang="scss">
.wrapper {
	width: 100%;
	height: auto;

	&:global(.--has-inner-shadow) {
		padding: 3px 5px 5px 3px;
		margin-right: -5px;
	}

	.slide {
		@include unselectable;

		&:global(.--has-inner-shadow) {
			:nth-child(n) {
				@include shadow;
			}
		}

		width: 100%;
		max-width: 100%;
		display: flex;
		justify-content: center;
	}
}
</style>
