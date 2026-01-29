<script setup lang="ts">
import {
	isFormDate,
	isFormField,
	isFormRow,
	isFormSelect,
	isFormSeparator,
	type Form,
	type FormElement,
} from "~/components/types/Form";
import type { FormField } from "./types/FormField";
import type { FormSeparator } from "./types/FormSeparator";
import type { FormDate } from "./types/FormDate";
import type { FormSelect } from "./types/FormSelect";
import type { FormRow } from "./types/FormRow";
import { select } from "three/tsl";
import { cloneDeep } from "lodash";

const props = defineProps({
	form: {
		type: Object as PropType<Form>,
		required: true,
	},

	submit: {
		type: String,
	},

	button: {
		type: String,
	},
});

const emit = defineEmits(["submit", "update", "buttonClick"]);

const form: Ref<Form> = ref(props.form);

watch(
	form,
	() => {
		emit("update", form);
	},
	{
		deep: true,
	},
);

const selectOptions = (callback: Function, group: string) => {
	let rows: Array<FormRow> = form.value.elems.filter(isFormRow);
	let accRowSelects: Array<FormSelect> = [];
	for (let i = 0; i < rows.length; i++) {
		const rowSelects = rows[i]?.elems.filter(isFormSelect);
		if (!rowSelects) {
			continue;
		}
		accRowSelects.push(...rowSelects);
	}
	accRowSelects = accRowSelects.filter((select) => select.group === group);
	let selects: Array<FormSelect> = form.value.elems
		.filter(isFormSelect)
		.filter((select) => select.group === group);

	return callback(...selects, ...accRowSelects);
};

const isDisabled = computed(() => {
	let reqEmpty: boolean = false;
	form.value.elems.forEach((elem) => {
		if (
			(isFormField(elem) &&
				elem.required &&
				!isValidField(elem.validator, elem.value)) ||
			(isFormDate(elem) &&
				elem.required &&
				!isValidDate(elem.validator, elem.value)) ||
			(isFormSelect(elem) &&
				elem.required &&
				!isValidSelect(elem.validator, elem.value))
		) {
			reqEmpty = true;
		}
	});

	return reqEmpty;
});

const isValidField = (
	callBack: Function | undefined,
	value: string | undefined,
): Boolean => {
	if (callBack === undefined) {
		return true;
	} else {
		if (value != undefined && value.length !== 0) {
			return callBack(value);
		} else {
			return false;
		}
	}
};

const isValidDate = (
	callBack: Function | undefined,
	value: Date | undefined,
): Boolean => {
	if (callBack === undefined) {
		return true;
	} else {
		if (value != undefined) {
			return callBack(value);
		} else {
			return false;
		}
	}
};

const isValidSelect = (
	callBack: Function | undefined,
	value: String | undefined,
): Boolean => {
	if (callBack === undefined) {
		return true;
	} else {
		if (value != undefined) {
			return callBack(value);
		} else {
			return false;
		}
	}
};
</script>

<template>
	<div :class="$style.wrapper">
		<div v-if="form.title?.length" :class="$style.title">
			{{ form.title }}
		</div>
		<UiLogo v-else></UiLogo>

		<template
			v-for="(elem, index) in form.elems"
			:key="$style.elem + index"
		>
			<div v-if="isFormSeparator(elem)" :class="$style.separator">
				<div v-if="elem.separator" :class="$style.line"></div>
				<div v-if="elem.name" :class="$style.title">
					{{ elem.name }}
				</div>
			</div>

			<div v-else-if="isFormField(elem)" :class="$style.elem">
				<UiInput
					:leftIconName="elem.leftIconName"
					:placeholder="elem.placeholder"
					:type="elem.type"
					v-model="elem.value"
					:class="$style.input"
				></UiInput>
			</div>

			<div v-else-if="isFormDate(elem)" :class="$style.elem">
				<ClientOnly>
					<UiDatePicker
						:leftIconName="elem.leftIconName"
						:placeholder="elem.placeholder"
						v-model="elem.value"
					/>
				</ClientOnly>
			</div>

			<div v-else-if="isFormSelect(elem)" :class="$style.elem">
				<UiSelect
					v-model="elem.value"
					:options="selectOptions(elem.options, elem.group)"
					:leftIconName="elem.leftIconName"
					:placeholder="elem.placeholder"
				/>
			</div>

			<div v-else-if="isFormRow(elem)" :class="$style.row">
				<template
					v-for="(rowElem, index) in elem.elems"
					:key="$style.elem + index"
				>
					<div v-if="isFormField(rowElem)" :class="$style.elem">
						<UiInput
							:leftIconName="rowElem.leftIconName"
							:placeholder="rowElem.placeholder"
							:type="rowElem.type"
							v-model="rowElem.value"
							:class="$style.input"
						></UiInput>
					</div>

					<div v-else-if="isFormDate(rowElem)" :class="$style.elem">
						<ClientOnly>
							<UiDatePicker
								:leftIconName="rowElem.leftIconName"
								:placeholder="rowElem.placeholder"
								v-model="rowElem.value"
							/>
						</ClientOnly>
					</div>

					<div v-else-if="isFormSelect(rowElem)" :class="$style.elem">
						<UiSelect
							v-model="rowElem.value"
							:options="
								selectOptions(rowElem.options, rowElem.group)
							"
							:leftIconName="rowElem.leftIconName"
							:placeholder="rowElem.placeholder"
						/>
					</div>
				</template>
			</div>
		</template>

		<div :class="$style.tools">
			<UiButton
				v-if="submit != undefined"
				:class="$style.button"
				:disable="isDisabled"
				accent
				@click="emit('submit')"
			>
				{{ submit }}
			</UiButton>

			<UiButton
				v-if="button != undefined"
				:class="$style.button"
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

.elem {
	display: flex;
	flex-direction: column;
	row-gap: 24px;
	width: 100%;
}

.row {
	display: flex;
	justify-content: space-between;
	column-gap: 10px;
}

.separator {
	display: flex;
	flex-direction: column;
	row-gap: 20px;
	width: 100%;

	.line {
		@include color-black-bg(0.2);

		width: 100%;
		height: 1px;
	}

	.title {
		@include title-s;
	}
}

.input {
	width: 100%;
}

.tools {
	display: flex;
	justify-content: end;
	column-gap: 10px;
}

.button {
	width: fit-content;
}
</style>
