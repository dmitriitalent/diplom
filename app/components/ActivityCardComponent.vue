<script setup lang="ts">
const props = defineProps<{
	activity: {
		id: string;
		title: string;
		startTime?: string;
		endTime?: string;
		location?: string;
		participants?: any[];
		imageIds?: string[];
	};
}>();

const coverImage = computed(() => {
	const guid = props.activity.imageIds?.[0];
	return guid ? `/api/images/byGuid?guid=${guid}` : null;
});

const formatWhen = (iso?: string) => {
	if (!iso) return "";
	try {
		const d = new Date(iso);
		return d.toLocaleString("ru-RU", {
			day: "2-digit",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
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
	<div :class="[$style.card, isPast && $style.past]">
		<div v-if="isPast" :class="$style.endedBadge">
			<Icon name="mdi:lock-outline" :class="$style.endedIcon" />
			<span>Окончено</span>
		</div>
		<div v-else-if="isNow" :class="$style.nowBadge">
			<span :class="$style.nowDot" />
			Сейчас
		</div>
		<div
			:class="[$style.cover, { [$style.coverFallback]: !coverImage }]"
			:style="coverImage ? { backgroundImage: `url(${coverImage})` } : undefined"
		>
			<span :class="$style.when">{{ formatWhen(activity.startTime) }}</span>
		</div>
		<h4 :class="$style.title">{{ activity.title }}</h4>
		<div v-if="activity.location" :class="$style.location">
			<Icon name="mdi:map-marker-outline" :class="$style.icon" />
			<span>{{ activity.location }}</span>
		</div>
		<div :class="$style.foot">
			<span :class="$style.pill">
				{{ activity.participants?.length ?? 0 }} идут
			</span>
		</div>
	</div>
</template>

<style module lang="scss">
.card {
	@include color-white-bg(0.72);
	@include shadow;

	position: relative;
	width: 100%;
	min-height: 220px;
	padding: 16px;
	border-radius: 12px;
	backdrop-filter: blur(12px);
	display: flex;
	flex-direction: column;
	row-gap: 10px;
	box-sizing: border-box;
	transition: opacity $transition-fast;

	&.past {
		opacity: 0.6;
	}
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
	border-radius: 12px;
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

.cover {
	height: 120px;
	border-radius: 8px;
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
	display: flex;
	align-items: flex-end;
	padding: 10px;
	box-sizing: border-box;
}

.coverFallback {
	background: var(--theme-event-gradient);
}

.when {
	@include text-xs;
	@include color-black;

	background: $color-white;
	padding: 3px 8px;
	border-radius: 100px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	font-weight: 600;
}

.title {
	@include reset;
	@include title-xs;
	@include color-black;
}

.location {
	@include text-s;
	@include color-black(0.6);

	display: flex;
	align-items: center;
	column-gap: 6px;
}

.icon {
	width: 14px;
	height: 14px;
	flex-shrink: 0;
}

.foot {
	margin-top: auto;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.pill {
	@include text-xs;
	@include color-black(0.65);
	@include color-black-bg(0.06);

	padding: 2px 8px;
	border-radius: 100px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}

@keyframes nowPulse {
	0%, 100% { opacity: 0.8; }
	50% { opacity: 0.2; }
}
</style>
