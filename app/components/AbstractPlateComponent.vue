<script setup lang="ts">
import type { PropType } from "vue";
import type { Abstract } from "~/entities/Abstract";
import { useDevice } from "~/composables/device";

const props = defineProps({
	abstract: {
		type: Object as PropType<Abstract>,
		required: true,
	},
});

const { deviceClassList } = useDevice();
</script>

<template>
	<NuxtLink :to="`/abstracts/${abstract.id}`" :class="$style.link">
		<div :class="[$style.wrapper, ...deviceClassList]">
			<div v-if="abstract.imageIds?.length" :class="$style.thumb">
				<img
					:class="$style.thumbImg"
					:src="`/api/images/byGuid?guid=${abstract.imageIds[0]}`"
				/>
			</div>
			<div v-else :class="[$style.thumb, $style.thumbEmpty]">
				<Icon
					:name="
						abstract.type === 'lab'
							? 'mdi:flask-outline'
							: 'mdi:book-open-page-variant-outline'
					"
					:class="$style.thumbIcon"
				/>
			</div>

			<div :class="$style.body">
				<span :class="$style.subject">{{ abstract.subject }}</span>
				<h3 :class="$style.title">{{ abstract.title }}</h3>
				<p :class="$style.description">{{ abstract.description }}</p>
				<div :class="$style.footer">
					<span :class="$style.author">
						<Icon
							name="mdi:account-outline"
							:class="$style.metaIcon"
						/>
						{{ abstract.author?.name }} {{ abstract.author?.surname }}
					</span>
					<span :class="[$style.likes, abstract.userLiked && $style.likedActive]">
						<Icon
							:name="
								abstract.userLiked
									? 'mdi:heart'
									: 'mdi:heart-outline'
							"
							:class="$style.likeIcon"
						/>
						{{ abstract.likeCount }}
					</span>
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
	column-gap: 14px;
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
		width: 140px;
		min-width: 140px;
		height: 120px;
		flex-shrink: 0;
		overflow: hidden;

		@include respond-to(mobile) {
			width: 100%;
			min-width: 0;
			height: 180px;
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
			@include color-black(0.3);
			width: 36px;
			height: 36px;
		}
	}

	.body {
		flex: 1;
		min-width: 0;
		padding: 12px 14px 12px 0;
		display: flex;
		flex-direction: column;
		row-gap: 4px;

		@include respond-to(mobile) {
			padding: 12px 14px 14px;
		}

		.subject {
			@include text-s;
			@include color-accent;

			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			font-size: 11px;
		}

		.title {
			@include reset;
			@include title-s;
			@include color-black;

			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
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

		.author {
			@include text-s;
			@include color-black;

			display: flex;
			align-items: center;
			column-gap: 4px;
			opacity: 0.5;
			font-size: 12px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.metaIcon {
			width: 13px;
			height: 13px;
		}

		.likes {
			@include text-s;
			@include color-black;

			display: flex;
			align-items: center;
			column-gap: 4px;
			opacity: 0.6;
			font-size: 12px;
			flex-shrink: 0;

			&.likedActive {
				@include color-accent;
				opacity: 1;
			}

			.likeIcon {
				width: 14px;
				height: 14px;
			}
		}
	}
}
</style>
