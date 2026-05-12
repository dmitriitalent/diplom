<script setup lang="ts">
import type { PropType } from "vue";
import type { Activity } from "~/entities/Activity";
import { useDevice } from "~/composables/device";

const props = defineProps({
	activity: {
		type: Object as PropType<Activity>,
		required: true,
	},
});

const { deviceClassList } = useDevice();

const formatDate = (iso: string) => {
	const d = new Date(iso);
	return (
		d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }) +
		" " +
		d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
	);
};

const statusLabel: Record<string, string> = {
	pending: "На проверке",
	approved: "Одобрено",
	declined: "Отклонено",
	blocked: "Заблокировано",
};
</script>

<template>
	<div
		:class="[
			$style.wrapper,
			activity.moderationStatus === 'pending' && $style.pending,
			...deviceClassList,
		]"
	>
		<div v-if="activity.imageIds?.length" :class="$style.thumb">
			<img
				:class="$style.thumbImg"
				:src="`/api/images/byGuid?guid=${activity.imageIds[0]}`"
			/>
		</div>
		<div v-else :class="[$style.thumb, $style.thumbEmpty]">
			<Icon name="mdi:calendar-blank-outline" :class="$style.thumbIcon" />
		</div>

		<div :class="$style.body">
			<div :class="$style.top">
				<h3 :class="$style.title">{{ activity.title }}</h3>
				<span
					v-if="
						activity.moderationStatus &&
						activity.moderationStatus !== 'approved'
					"
					:class="[
						$style.badge,
						$style['badge_' + activity.moderationStatus],
					]"
				>
					{{
						statusLabel[activity.moderationStatus] ??
						activity.moderationStatus
					}}
				</span>
			</div>

			<p :class="$style.description">{{ activity.description }}</p>

			<div :class="$style.meta">
				<span v-if="activity.location" :class="$style.metaItem">
					<Icon
						name="mdi:map-marker-outline"
						:class="$style.metaIcon"
					/>
					{{ activity.location }}
				</span>
				<span v-if="activity.startTime" :class="$style.metaItem">
					<Icon name="mdi:clock-outline" :class="$style.metaIcon" />
					{{ formatDate(activity.startTime) }}
					<span v-if="activity.endTime">
						— {{ formatDate(activity.endTime) }}</span
					>
				</span>
				<span
					v-if="activity.participants?.length"
					:class="$style.metaItem"
				>
					<Icon
						name="mdi:account-group-outline"
						:class="$style.metaIcon"
					/>
					{{ activity.participants.length }}
				</span>
				<span v-if="activity.isPrivate" :class="$style.metaItem">
					<Icon name="mdi:lock-outline" :class="$style.metaIcon" />
					Закрытое
				</span>
			</div>

			<div :class="$style.author">
				<Icon name="mdi:account-outline" :class="$style.authorIcon" />
				{{ activity.author?.name }} {{ activity.author?.surname }}
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

	@include respond-to(mobile) {
		flex-direction: column;
		column-gap: 0;
	}

	.thumb {
		width: 180px;
		min-width: 180px;
		height: 140px;
		border-radius: 12px;
		overflow: hidden;
		flex-shrink: 0;

		@include respond-to(mobile) {
			width: 100%;
			min-width: 0;
			height: 240px;
			border-radius: 0;
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

		@include respond-to(mobile) {
			padding: 12px 14px 14px;
		}
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
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		column-gap: 14px;
		row-gap: 2px;
		margin-top: auto;
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

		.authorIcon {
			width: 13px;
			height: 13px;
		}
	}
}
</style>
