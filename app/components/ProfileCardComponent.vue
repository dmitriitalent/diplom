<script setup lang="ts">
import type { User } from "~/entities/User";

const props = defineProps({
	user: {
		type: Object as PropType<User>,
		required: true,
	},
});
</script>

<template>
	<div :class="[$style.wrapper, 'profileCardComponent']">
		<UiImage
			src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPtfWYlVSiYwNISg_NUUF1Bl6PjtZmbchcDw&s"
		></UiImage>

		<div :class="$style.info">
			<h2 :class="$style.name">{{ user.surname + " " + user.name }}</h2>
			<h2 v-if="user.birthdate != null" :class="$style.age">
				, {{ getAgeFromUnix(new Date(user.birthdate).getTime()) }}
			</h2>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	width: 100%;
	aspect-ratio: 0.7;

	.info {
		display: flex;
	}

	.name,
	.age {
		@include reset;
		@include title-s;
		@include color-black;
	}
}
</style>
