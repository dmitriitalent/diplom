<script setup lang="ts">
import type { PropType } from "vue";
import type { News } from "~/entities/News";

const props = defineProps({
	news: {
		type: Object as PropType<News>,
		required: true,
	},
});

const formatDate = (iso: string) => {
	const d = new Date(iso);
	return d.toLocaleDateString("ru-RU", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
};

const reactionIcon: Record<string, string> = {
	like: "mdi:thumb-up",
	dislike: "mdi:thumb-down",
	heart: "mdi:heart",
};
</script>

<template>
	<div
		:class="[
			$style.wrapper,
			news.moderationStatus === 'pending' && $style.pending,
		]"
	>
		<div v-if="news.imageIds?.length" :class="$style.thumb">
			<img
				:class="$style.thumbImg"
				:src="`/api/images/byGuid?guid=${news.imageIds[0]}`"
			/>
		</div>
		<div v-else :class="[$style.thumb, $style.thumbEmpty]">
			<Icon name="mdi:newspaper-variant-outline" :class="$style.thumbIcon" />
		</div>

		<div :class="$style.body">
			<div :class="$style.top">
				<h3 :class="$style.title">{{ news.title }}</h3>
				<span
					v-if="news.moderationStatus && news.moderationStatus !== 'approved'"
					:class="[$style.badge, $style['badge_' + news.moderationStatus]]"
				>
					{{ news.moderationStatus === 'pending' ? 'На проверке' : news.moderationStatus }}
				</span>
			</div>

			<p :class="$style.description">{{ news.content }}</p>

			<div :class="$style.footer">
				<div :class="$style.meta">
					<span v-if="news.createdAt" :class="$style.metaItem">
						<Icon name="mdi:calendar-outline" :class="$style.metaIcon" />
						{{ formatDate(news.createdAt) }}
					</span>
					<span v-if="news.reactionCount" :class="$style.metaItem">
						<Icon name="mdi:heart-outline" :class="$style.metaIcon" />
						{{ news.reactionCount }}
					</span>
					<span
						v-if="news.activityIds?.length"
						:class="$style.metaItem"
					>
						<Icon name="mdi:calendar-blank-outline" :class="$style.metaIcon" />
						{{ news.activityIds.length }}
					</span>
					<span
						v-if="news.productIds?.length"
						:class="$style.metaItem"
					>
						<Icon name="mdi:tag-outline" :class="$style.metaIcon" />
						{{ news.productIds.length }}
					</span>
				</div>

				<div :class="$style.author">
					<Icon name="mdi:account-outline" :class="$style.authorIcon" />
					{{ news.author?.name }} {{ news.author?.surname }}
				</div>
			</div>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	width: 100%;
	display: flex;
	column-gap: 16px;
	border-radius: 12px;
	overflow: hidden;
	transition: background-color $transition-fast;

	@include shadow;

	&:hover {
		@include color-black-bg(0.03);
	}

	&.pending {
		@include color-warn-bg(0.15);
	}
}

.thumb {
	width: 180px;
	min-width: 180px;
	height: 140px;
	border-radius: 12px;
	overflow: hidden;
	flex-shrink: 0;

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
	}
}

.badge {
	@include text-s;

	flex-shrink: 0;
	padding: 2px 8px;
	border-radius: 100px;
	font-size: 11px;
	white-space: nowrap;

	&.badge_pending {
		@include color-warn-bg;
	}
	&.badge_declined,
	&.badge_blocked {
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
</style>
