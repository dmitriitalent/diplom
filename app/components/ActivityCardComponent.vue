<script setup lang="ts">
defineProps<{
	activity: {
		id: string;
		title: string;
		startTime?: string;
		location?: string;
		participants?: any[];
	};
}>();

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
</script>

<template>
	<div :class="$style.card">
		<div :class="$style.cover">
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

	width: 100%;
	min-height: 220px;
	padding: 16px;
	border-radius: 12px;
	backdrop-filter: blur(12px);
	display: flex;
	flex-direction: column;
	row-gap: 10px;
	box-sizing: border-box;
}

.cover {
	height: 120px;
	border-radius: 8px;
	background: linear-gradient(135deg, #fde2c4, #ffd1a1, #f7b87f);
	display: flex;
	align-items: flex-end;
	padding: 10px;
	box-sizing: border-box;
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
</style>
