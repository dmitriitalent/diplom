<script setup lang="ts">
const props = defineProps({
	delay: {
		type: Number,
		default: 100,
	},
});

const show: Ref<Boolean> = ref(false);

onMounted(() => {
	setTimeout(() => {
		show.value = true;
	}, props.delay);
});
</script>

<template>
	<UiTransition name="fade-top" mode="out-in">
		<div v-if="show">
			<slot></slot>
		</div>
		<div v-else :class="$style.placeholder">
			<slot></slot>
		</div>
	</UiTransition>
</template>

<style module lang="scss">
.placeholder {
	visibility: hidden;
}
</style>
