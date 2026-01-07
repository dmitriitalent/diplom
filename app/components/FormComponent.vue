<script setup lang="ts">
import { type FormField } from "~/components/types/FormField";

const props = defineProps({
	title: {
		type: String,
	},

	fields: {
		type: Array<FormField>,
		required: true,
	},

	button: {
		type: String,
	},
});

const emit = defineEmits(["buttonClick", "update"]);

const fieldsData: Ref<Array<FormField>> = ref(props.fields);

watch(
	fieldsData,
	() => {
		emit("update", fieldsData);
	},
	{
		deep: true,
	}
);

const isDisabled = computed(() => {
	let reqEmpty: boolean = false;
	fieldsData.value.forEach((field) => {
		if (
			field.required &&
			!isValidField(field.validator, field.value, field.date)
		) {
			reqEmpty = true;
		}
	});

	return reqEmpty;
});

const isValidField = (
	callBack: Function | undefined,
	value: string | undefined,
	date: Date | undefined
): Boolean => {
	if (callBack === undefined) {
		return true;
	} else {
		if (value != undefined && value.length !== 0) {
			return callBack(value);
		} else if (date != undefined) {
			return callBack(date);
		} else {
			return false;
		}
	}
};
</script>

<template>
	<div :class="$style.wrapper">
		<div v-if="title?.length" :class="$style.title">
			{{ title }}
		</div>
		<UiLogo v-else></UiLogo>

		<div
			v-for="(field, index) in fieldsData"
			:key="$style.field + index"
			:class="$style.field"
		>
			<div v-if="field.separatorTop" :class="$style.separator"></div>

			<UiInput
				v-if="
					field.type === 'text' ||
					field.type === 'number' ||
					field.type === 'password'
				"
				:leftIconName="field.leftIconName"
				v-bind="field"
				:type="field.type"
				v-model="field.value"
				:class="$style.input"
			></UiInput>

			<UiSelect
				v-if="
					field.type === 'select' && field.selectOptions !== undefined
				"
				v-model="field.value"
				:options="field.selectOptions"
				:leftIconName="field.leftIconName"
				:placeholder="field.placeholder"
			/>

			<ClientOnly>
				<UiDatePicker
					v-if="field.type === 'date'"
					:leftIconName="field.leftIconName"
					:placeholder="field.placeholder"
					v-model="field.date"
				/>
			</ClientOnly>
			<div v-if="field.separatorBottom" :class="$style.separator"></div>
		</div>

		<div :class="$style.tools">
			<UiButton
				v-if="button != undefined"
				:class="$style.submit"
				:disable="isDisabled"
				accent
				@click="emit('buttonClick')"
			>
				{{ button }}
			</UiButton>
		</div>
	</div>
</template>

<style lang="scss" module>
.wrapper {
	padding: 24px;
	box-sizing: border-box;
	width: 100%;
	display: flex;
	flex-direction: column;
	row-gap: 24px;

	@include respond-to(mobile) {
		padding: 24px 0;
	}
}

.title {
	@include title-m;
	@include color-black;
	@include unselectable;
}

.field {
	display: flex;
	flex-direction: column;
	row-gap: 24px;
}

.separator {
	@include color-black-bg(0.2);

	height: 1px;
	width: 100%;
}

.input {
	width: 100%;
}

.tools {
	display: flex;
}

.submit {
	margin-left: auto;
}
</style>
