<script setup lang="ts" generic="T">
import type { TimelineSession } from "./types/TimelineSession";

const props = defineProps<{
	startUnix: number;
	endUnix: number;
	sessions: TimelineSession<T>[];
}>();

const emit = defineEmits([
	"minusClick",
	"plusClick",
	"prevClick",
	"nextClick",
	"sessionMouseEnter",
	"sessionMouseLeave",
]);

const start = computed(() => props.startUnix);
const end = computed(() => props.endUnix);
const period = computed(() => end.value - start.value);

// ─── Zoom step ────────────────────────────────────────────────────────────────

const hourStep = computed(() => {
	const p = period.value;
	if (p <= 26400) return 1;
	if (p <= 172800) return 2;
	if (p <= 259200) return 3;
	if (p <= 345600) return 4;
	return 0; // dates only
});

// ─── Segments (each = 1 displayed tick mark) ─────────────────────────────────

// Buffer = 35% of period so segments are pre-rendered before entering viewport.
// Pan step is 30%, so 35% guarantees elements exist in DOM before they slide in.
const edgeBufferHours = computed(() => Math.ceil((period.value / 3600) * 0.35));

type Segment = {
	key: number; // absolute hour index — stable key for Vue, enables CSS transition on `left`
	unix: number;
	label: string;
	isDate: boolean;
};

const formatDate = (unix: number) => {
	const d = new Date(unix * 1000);
	return `${d.getUTCDate() > 9 ? " " : "0"}${d.getUTCDate()}.${d.getUTCMonth() + 1 > 9 ? " " : "0"}${d.getUTCMonth() + 1}`;
};

const segments = computed<Segment[]>(() => {
	if (period.value <= 0) return [];
	const step = hourStep.value;
	const buf = edgeBufferHours.value;
	const startH = Math.floor(start.value / 3600) - buf;
	const endH = Math.ceil(end.value / 3600) + buf;
	const list: Segment[] = [];

	for (let h = startH; h <= endH; h++) {
		const hour = ((h % 24) + 24) % 24;
		const isDate = hour === 0;
		if (!isDate && step === 0) continue;
		if (!isDate && step > 0 && h % step !== 0) continue;

		const unix = h * 3600;
		list.push({
			key: h,
			unix,
			label: isDate ? formatDate(unix) : String(hour),
			isDate,
		});
	}
	return list;
});

// Position of a segment as % of timeline width (can be <0 or >100 — clipped by overflow:hidden)
const segLeft = (hourIdx: number) =>
	((hourIdx * 3600 - start.value) / period.value) * 100;

// Dates are ~10 chars wide and need a bigger threshold than 1-2 char hour labels
const segShowLabel = (hourIdx: number, isDate: boolean) => {
	const left = segLeft(hourIdx);
	const threshold = isDate ? 14 : 4;
	return left > threshold && left < 100 - threshold;
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

// Longest sessions rendered first → shorter ones come later in DOM → appear on top without z-index tricks
const processedSessions = computed<TimelineSession<T>[]>(() =>
	[...props.sessions].sort(
		(a, b) => b.endAt - b.startAt - (a.endAt - a.startAt),
	),
);

const sessionStyle = (session: TimelineSession<T>) => {
	if (period.value <= 0) return {};
	const left = ((session.startAt - start.value) / period.value) * 100;
	const width = ((session.endAt - session.startAt) / period.value) * 100;
	if (width <= 0) return {};
	return {
		left: `${left}%`,
		width: `${width}%`,
		backgroundColor: session.color ?? "#000",
	};
};

// ─── Emits ────────────────────────────────────────────────────────────────────

const onSessionMouseEnter = (e: Event, s: TimelineSession) =>
	emit("sessionMouseEnter", e, s);
const onSessionMouseLeave = (e: Event, s: TimelineSession) =>
	emit("sessionMouseLeave", e, s);
</script>

<template>
	<div :class="$style.wrapper">
		<ClientOnly>
			<!-- Timestamps row: overflow:hidden clips off-screen segments -->
			<div :class="$style.stampsViewport">
				<div
					v-for="seg in segments"
					:key="seg.key"
					:class="[$style.stamp, seg.isDate && $style.stampDate]"
					:style="{ left: segLeft(seg.key) + '%' }"
				>
					<div :class="$style.mark" />
					<span
						v-if="segShowLabel(seg.key, seg.isDate)"
						:class="$style.label"
						>{{ seg.label }}</span
					>
				</div>
			</div>

			<!-- Bar: overflow:hidden clips sessions that partially exit left/right -->
			<div :class="$style.bar">
				<div
					v-for="session in processedSessions"
					:key="session.startAt"
					:class="$style.session"
					:style="sessionStyle(session)"
					@mouseenter="(e) => onSessionMouseEnter(e, session)"
					@mouseleave="(e) => onSessionMouseLeave(e, session)"
				/>
			</div>

			<!-- Controls -->
			<div :class="$style.tools">
				<UiButton @click="emit('prevClick')">
					<Icon
						:class="$style.icon"
						name="ic:round-keyboard-arrow-left"
					/>
				</UiButton>
				<UiButton @click="emit('minusClick')">
					<Icon
						:class="$style.icon"
						name="heroicons:magnifying-glass-minus"
					/>
				</UiButton>
				<UiButton @click="emit('plusClick')">
					<Icon
						:class="$style.icon"
						name="heroicons:magnifying-glass-plus"
					/>
				</UiButton>
				<UiButton @click="emit('nextClick')">
					<Icon
						:class="$style.icon"
						name="ic:round-keyboard-arrow-right"
					/>
				</UiButton>
			</div>
		</ClientOnly>
	</div>
</template>

<style module lang="scss">
.wrapper {
	@include color-black;

	display: flex;
	flex-direction: column;
	row-gap: 4px;

	// ── Timestamps ──────────────────────────────────────────────────────────

	.stampsViewport {
		position: relative;
		height: 28px;
		overflow: hidden;

		.stamp {
			position: absolute;
			bottom: 0;
			transform: translateX(-50%);
			transition: left 0.25s ease-in-out;
			animation: stampFadeIn 0.2s ease-out;
			display: flex;
			flex-direction: column;
			align-items: center;

			.mark {
				width: 1px;
				height: 6px;
				background: currentColor;
				opacity: 0.4;
			}

			.label {
				@include text-s;

				position: absolute;
				bottom: 8px;
				white-space: nowrap;
				transform: translateX(-50%);
				left: 50%;
			}

			&.stampDate {
				.label {
					@include title-xs;

					bottom: 10px;
				}

				.mark {
					height: 8px;
					opacity: 0.7;
				}
			}
		}
	}

	// ── Bar ─────────────────────────────────────────────────────────────────

	.bar {
		background-color: #c8f0c8;
		height: 10px;
		width: 100%;
		position: relative;
		border-radius: 5px;
		overflow: hidden;

		.session {
			position: absolute;
			height: 100%;
			z-index: 2;
			transition:
				left 0.25s ease-in-out,
				width 0.25s ease-in-out;
			animation: stampFadeIn 0.2s ease-out;

			&:hover {
				transform: scaleY(1.5);
			}
		}
	}

	// ── Controls ────────────────────────────────────────────────────────────

	@keyframes stampFadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.tools {
		display: flex;
		justify-content: center;
		column-gap: 8px;
		margin-top: 6px;

		.icon {
			height: 24px;
			width: 24px;
		}
	}
}
</style>
