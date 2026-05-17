<script setup lang="ts">
import type { PropType } from "vue";
import type { Activity } from "~/entities/Activity";
import { useDevice } from "~/composables/device";
import { useCacheStore } from "~/stores/cacheStore";

const props = defineProps({
	activity: {
		type: Object as PropType<Activity>,
		required: true,
	},
});

const { deviceClassList } = useDevice();
const cacheStore = useCacheStore();

const onClick = () => {
	cacheStore.activities.set({ ...props.activity });
};

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

const now = () => new Date();

const isPast = computed(() => {
	const end = props.activity.endTime;
	return !!end && new Date(end) < now();
});

const isNow = computed(() => {
	const start = props.activity.startTime;
	const end = props.activity.endTime;
	if (!start || !end) return false;
	const n = now();
	return new Date(start) <= n && new Date(end) >= n;
});
</script>

<template>
	<NuxtLink
		:to="`/activities/${activity.id}`"
		:class="$style.link"
		@click="onClick"
	>
		<div
			:class="[
				$style.wrapper,
				activity.moderationStatus === 'pending' && $style.pending,
				isPast && $style.past,
				...deviceClassList,
			]"
		>
			<div v-if="isPast" :class="$style.endedBadge">
				<Icon name="mdi:lock-outline" :class="$style.endedIcon" />
				<span>Окончено</span>
			</div>
			<div v-else-if="isNow" :class="$style.nowBadge">
				<span :class="$style.nowDot" />
				Сейчас
			</div>
			<div v-if="activity.imageIds?.length" :class="$style.thumb">
				<img
					:class="$style.thumbImg"
					:src="`/api/images/byGuid?guid=${activity.imageIds[0]}`"
				/>
			</div>
			<div v-else :class="[$style.thumb, $style.thumbEmpty]">
				<Icon
					name="mdi:calendar-blank-outline"
					:class="$style.thumbIcon"
				/>
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
						<Icon
							name="mdi:clock-outline"
							:class="$style.metaIcon"
						/>
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
						<Icon
							name="mdi:lock-outline"
							:class="$style.metaIcon"
						/>
						Закрытое
					</span>
				</div>

				<div :class="$style.author">
					<Icon
						name="mdi:account-outline"
						:class="$style.authorIcon"
					/>
					{{ activity.author?.name }} {{ activity.author?.surname }}
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
	@include shadow;
	@include color-white-bg(0.72);

	position: relative;
	width: 100%;
	display: flex;
	column-gap: 16px;
	border-radius: 12px;
	overflow: hidden;
	transition: background-color $transition-fast, opacity $transition-fast;

	&:hover {
		@include color-white-bg;
	}

	&.pending {
		@include color-warn-bg(0.15);
	}

	&.past {
		opacity: 0.6;
	}

	.endedBadge {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		row-gap: 5px;
		background: rgba($color-black-rgb, 0.07);
		backdrop-filter: blur(2px);
		pointer-events: none;

		@include text-s;
		@include color-black;

		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		font-size: 11px;
	}

	.endedIcon {
		width: 20px;
		height: 20px;
		opacity: 0.7;
	}

	.nowBadge {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 2;
		display: flex;
		align-items: center;
		column-gap: 5px;
		padding: 3px 10px 3px 7px;
		border-radius: 100px;
		background: $color-success;
		pointer-events: none;

		@include text-s;
		@include color-black;

		font-weight: 700;
		font-size: 11px;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.nowDot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: currentColor;
		opacity: 0.8;
		animation: nowPulse 1.5s ease-in-out infinite;
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

@keyframes nowPulse {
	0%, 100% { opacity: 0.8; }
	50% { opacity: 0.2; }
}
</style>
