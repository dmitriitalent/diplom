<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";

const emit = defineEmits<{
	(e: "intersect"): void;
}>();

const target = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;

onMounted(() => {
	if (!target.value) return;

	observer = new IntersectionObserver(
		(entries) => {
			const entry = entries[0];

			if (entry && entry.isIntersecting) {
				emit("intersect");
			}
		},
		{
			root: null,
			rootMargin: "0px",
			threshold: 0.1,
		},
	);

	observer.observe(target.value);
});

onBeforeUnmount(() => {
	if (observer && target.value) {
		observer.unobserve(target.value);
	}
});
</script>

<template>
	<div ref="target" style="height: 1px"></div>
</template>
