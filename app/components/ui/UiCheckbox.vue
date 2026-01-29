<script setup lang="ts">
const emit = defineEmits(["update:modelValue"]);

const props = defineProps({
	modelValue: {
		type: Boolean,
	},

	leftIconName: {
		type: String,
	},

	name: {
		type: String,
	},
});

const onInput = (event: Event) => {
	const target = event.target as HTMLInputElement;
	emit("update:modelValue", target.checked);
};
</script>

<template>
	<div class="UiCheckbox__wrapper">
		<Icon v-if="leftIconName" :name="leftIconName"></Icon>
		<input type="checkbox" :checked="modelValue" @change="onInput" />
		<div class="name" v-html="name"></div>
	</div>
</template>

<style lang="scss">
.UiCheckbox__ {
	&wrapper {
		display: flex;
		column-gap: 12px;
		align-items: center;

		.name {
			@include text-m;
			@include color-black;
		}
	}
}
</style>
