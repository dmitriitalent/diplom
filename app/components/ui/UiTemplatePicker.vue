<script setup lang="ts">
import type { TemplateDefinition } from "~/constants/templates";

const props = defineProps<{
	templates: TemplateDefinition[];
	modelValue: number;
}>();

const emit = defineEmits<{
	(e: "update:modelValue", value: number): void;
}>();

/**
 * Для каждого шаблона проверяем, существует ли превью на BFF.
 * Храним состояние: true = загружено, false = ошибка/нет файла, null = загружается
 */
const previewStatus = ref<Record<string, boolean | null>>({});

const previewUrl = (key: string) => `/api/staticfiles/${key}`;

const initPreviews = () => {
	for (const tpl of props.templates) {
		if (previewStatus.value[tpl.key] !== undefined) continue;
		previewStatus.value[tpl.key] = null; // загружается
		fetch(previewUrl(tpl.key), { method: "HEAD" })
			.then((r) => {
				previewStatus.value[tpl.key] = r.ok;
			})
			.catch(() => {
				previewStatus.value[tpl.key] = false;
			});
	}
};

onMounted(initPreviews);
watch(() => props.templates, initPreviews, { deep: true });
</script>

<template>
	<div :class="$style.picker">
		<div
			v-for="tpl in templates"
			:key="tpl.id"
			:class="[$style.card, modelValue === tpl.id && $style.cardActive]"
			@click="emit('update:modelValue', tpl.id)"
		>
			<div :class="$style.preview">
				<!-- Показываем изображение, если BFF вернул OK -->
				<img
					v-if="previewStatus[tpl.key] === true"
					:src="previewUrl(tpl.key)"
					:alt="tpl.name"
					:class="$style.previewImg"
					@error="previewStatus[tpl.key] = false"
				/>
				<!-- Скелетон пока HEAD-запрос ещё не вернулся -->
				<div v-else-if="previewStatus[tpl.key] === null" :class="$style.previewSkeleton" />
				<!-- Fallback если файла нет -->
				<div v-else :class="$style.previewFallback">
					<Icon name="mdi:view-dashboard-outline" :class="$style.previewIcon" />
				</div>
			</div>
			<div :class="$style.label">{{ tpl.name }}</div>
			<div v-if="modelValue === tpl.id" :class="$style.check">
				<Icon name="mdi:check" :class="$style.checkIcon" />
			</div>
		</div>
	</div>
</template>

<style module lang="scss">
.picker {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}

.card {
	position: relative;
	display: flex;
	flex-direction: column;
	row-gap: 8px;
	width: 140px;
	cursor: pointer;
	border-radius: 10px;
	padding: 8px;
	border: 2px solid transparent;
	transition: border-color 0.15s, background 0.15s;

	@include color-black-bg(0.04);

	&:hover {
		@include color-black-bg(0.08);
	}
}

.cardActive {
	border-color: $color-black;

	@include color-black-bg(0.06);
}

.preview {
	width: 100%;
	aspect-ratio: 16/10;
	border-radius: 8px;
	overflow: hidden;

	@include color-black-bg(0.08);

	display: flex;
	align-items: center;
	justify-content: center;
}

.previewImg {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.previewSkeleton {
	width: 100%;
	height: 100%;
	border-radius: 8px;

	@include color-black-bg(0.08);

	animation: shimmer 1.4s ease-in-out infinite;

	@keyframes shimmer {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0.4; }
	}
}

.previewFallback {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.previewIcon {
	@include color-black(0.3);

	width: 32px;
	height: 32px;
}

.label {
	@include text-s;
	@include color-black;

	font-weight: 600;
	text-align: center;
}

.check {
	position: absolute;
	top: 6px;
	right: 6px;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;

	@include color-black-bg;
}

.checkIcon {
	@include color-white;

	width: 12px;
	height: 12px;
}
</style>
