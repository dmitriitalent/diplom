<script setup lang="ts">
import type { PropType } from "vue";

const props = defineProps({
	name: {
		type: String as PropType<
			"fade-left" | "fade-top" | "fade-right" | "fade-bottom"
		>,
	},

	mode: {
		type: String as PropType<"out-in" | "in-out" | "default">,
		default: "out-in",
	},
});
</script>

<template>
	<Transition :name="props.name" :mode="props.mode" appear>
		<slot></slot>
	</Transition>
</template>

<style lang="scss">
/* Общие параметры */
.fade-left-enter-active,
.fade-left-leave-active,
.fade-left-appear-active,
.fade-right-enter-active,
.fade-right-leave-active,
.fade-right-appear-active,
.fade-top-enter-active,
.fade-top-leave-active,
.fade-top-appear-active,
.fade-bottom-enter-active,
.fade-bottom-leave-active,
.fade-bottom-appear-active {
	transition: opacity $transition, transform $transition;
	will-change: opacity, transform;
}

/* LEFT */
.fade-left-enter-from,
.fade-left-leave-to,
.fade-left-appear-from {
	opacity: 0;
	transform: translateX(-24px);
}

.fade-left-enter-to,
.fade-left-leave-from,
.fade-left-appear-to {
	opacity: 1;
	transform: translateX(0);
}

/* RIGHT */
.fade-right-enter-from,
.fade-right-leave-to,
.fade-right-appear-from {
	opacity: 0;
	transform: translateX(24px);
}

.fade-right-enter-to,
.fade-right-leave-from,
.fade-right-appear-to {
	opacity: 1;
	transform: translateX(0);
}

/* TOP */
.fade-top-enter-from,
.fade-top-leave-to,
.fade-top-appear-from {
	opacity: 0;
	transform: translateY(-24px);
}

.fade-top-enter-to,
.fade-top-leave-from,
.fade-top-appear-to {
	opacity: 1;
	transform: translateY(0);
}

/* BOTTOM */
.fade-bottom-enter-from,
.fade-bottom-leave-to,
.fade-bottom-appear-from {
	opacity: 0;
	transform: translateY(24px);
}

.fade-bottom-enter-to,
.fade-bottom-leave-from,
.fade-bottom-appear-to {
	opacity: 1;
	transform: translateY(0);
}
</style>
