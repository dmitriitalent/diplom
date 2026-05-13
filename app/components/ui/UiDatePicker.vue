<script setup lang="ts">
import { VueDatePicker } from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import { ru } from "date-fns/locale";

const props = defineProps<{
	modelValue: Date | undefined | null;
	leftIconName: string | undefined;
	placeholder: string | undefined;
	enableTime: boolean | undefined;
}>();

const emit = defineEmits<{
	(e: "update:modelValue", value: string | null): void;
}>();
</script>

<template>
	<VueDatePicker
		:locale="ru"
		:formats="{ input: 'dd.MM.yyyy' + (enableTime ? ' - HH:mm' : '') }"
		:model-value="props.modelValue"
		:time-config="{ enableTimePicker: enableTime }"
		:placeholder="props.placeholder"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<template #input-icon>
			<Icon v-if="leftIconName" :name="leftIconName" />
		</template>
	</VueDatePicker>
</template>

<style lang="scss">
.dp__input_icon {
	margin-left: 16px;
	margin-top: 2px;
}
.dp__icon {
	padding: 0;
}
.dp--clear-btn {
	inset-inline-end: 18px;
	padding: 0;
}
.dp__input {
	font-weight: 500;
	display: flex;
	align-items: center;
}
.dp__theme_light {
	--dp-background-color: #{$color-white};
	--dp-text-color: #{$color-black};
	--dp-hover-color: #{$color-accent};
	--dp-hover-text-color: var(--dp-text-color);
	--dp-hover-icon-color: #{$color-black};
	--dp-primary-color: #{$color-accent};
	--dp-primary-disabled-color: #{rgba($color-accent-rgb, 0.3)};
	--dp-primary-text-color: #{$color-black};
	--dp-secondary-color: #{rgba($color-black-rgb, 0.3)};
	--dp-border-color: #{rgba($color-black-rgb, 0.3)};
	--dp-menu-border-color: #{rgba($color-black-rgb, 0.3)};
	--dp-border-color-hover: #{rgba($color-black-rgb, 0.3)};
	--dp-border-color-focus: #{rgba($color-black-rgb, 0.3)};
	--dp-disabled-color: #{$color-white};
	--dp-scroll-bar-background: #f3f3f3;
	--dp-scroll-bar-color: #959595;
	--dp-success-color: #76d275;
	--dp-success-color-disabled: #a3d9b1;
	--dp-icon-color: #000000;
	--dp-danger-color: #ff6f60;
	--dp-marker-color: #ff6f60;
	--dp-tooltip-color: #fafafa;
	--dp-disabled-color-text: #8e8e8e;
	--dp-highlight-color: rgb(25 118 210 / 10%);
	--dp-range-between-dates-background-color: var(--dp-hover-color, #f3f3f3);
	--dp-range-between-dates-text-color: var(--dp-hover-text-color, #212121);
	--dp-range-between-border-color: var(--dp-hover-color, #f3f3f3);

	--dp-font-family:
		-apple-system, blinkmacsystemfont, Montserrat, roboto, oxygen, ubuntu,
		cantarell, "Open Sans", "Helvetica Neue", sans-serif;
	--dp-border-radius: 10px; /*Configurable border-radius*/
	--dp-cell-border-radius: 10px; /*Specific border radius for the calendar cell*/
	--dp-common-transition: all 0.1s ease-in; /*Generic transition applied on buttons and calendar cells*/
	/*Sizing*/
	--dp-button-height: 35px; /*Size for buttons in overlays*/
	--dp-month-year-row-height: 35px; /*Height of the month-year select row*/
	--dp-month-year-row-button-size: 35px; /*Specific height for the next/previous buttons*/
	--dp-button-icon-height: 20px; /*Icon sizing in buttons*/
	--dp-cell-size: 35px; /*Width and height of calendar cell*/
	--dp-cell-padding: 5px; /*Padding in the cell*/
	--dp-common-padding: 10px; /*Common padding used*/
	--dp-input-icon-padding: 48px; /*Padding on the left side of the input if icon is present*/
	--dp-input-padding: 6px 30px 6px 12px; /*Padding in the input*/
	--dp-menu-min-width: 260px; /*Adjust the min width of the menu*/
	--dp-action-buttons-padding: 2px 5px; /*Adjust padding for the action buttons in action row*/
	--dp-row-margin: 5px 0; /*Adjust the spacing between rows in the calendar*/
	--dp-calendar-header-cell-padding: 0.5rem; /*Adjust padding in calendar header cells*/
	--dp-two-calendars-spacing: 10px; /*Space between multiple calendars*/
	--dp-overlay-col-padding: 3px; /*Padding in the overlay column*/
	--dp-time-inc-dec-button-size: 32px; /*Sizing for arrow buttons in the time picker*/
	--dp-menu-padding: 6px 8px; /*Menu padding*/

	/*Font sizes*/
	--dp-font-size: 1rem; /*Default font-size*/
	--dp-preview-font-size: 0.8rem; /*Font size of the date preview in the action row*/
	--dp-time-font-size: 0.8rem; /*Font size in the time picker*/

	/*Transitions*/
	--dp-animation-duration: #{$transition-fast}; /*Transition duration*/
	--dp-menu-appear-transition-timing: cubic-bezier(
		0.4,
		0,
		1,
		1
	); /*Timing on menu appear animation*/
	--dp-transition-timing: ease-out; /*Timing on slide animations*/
}
</style>
