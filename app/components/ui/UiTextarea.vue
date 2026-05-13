<script setup lang="ts">
import type { PropType } from "vue";
type Variant = "block" | "underline";
type Size = "small" | "medium" | "large" | "custom";

const emit = defineEmits(["update:modelValue", "input"]);

const props = defineProps({
	modelValue: {
		type: [String, Number],
	},

	rows: {
		type: Number,
		default: 1,
	},

	variant: {
		type: String as PropType<Variant>,
		default: "block",
	},

	size: {
		type: String as PropType<Size>,
		default: "medium",
	},

	placeholder: {
		type: String,
	},
});

const classList = computed(() => {
	return [[`--variant-${props.variant}`], [`--size-${props.size}`]];
});

const onInput = ($event: Event) => {
	emit("update:modelValue", ($event.target as HTMLInputElement).value);
	emit("input");
	resizeTextarea();
};

const textareaElem = useTemplateRef<HTMLTextAreaElement>("textarea");

const resizeTextarea = async () => {
	if (!textareaElem.value) return;

	await nextTick();

	textareaElem.value.style.height = "auto";
	textareaElem.value.style.height =
		textareaElem.value.scrollHeight + 3 + "px";
};
</script>

<template>
	<div class="uiTextarea__wrapper">
		<textarea
			class="uiTextarea__textarea"
			:rows="props.rows"
			:value="modelValue"
			:class="classList"
			:placeholder="props.placeholder"
			ref="textarea"
			@input="onInput($event)"
		/>
	</div>
</template>

<style lang="scss">
.uiTextarea__ {
	&wrapper {
		width: 100%;
	}

	&textarea {
		@include reset;
		@include scroll;
		@include color-black;
		@include text-s;
		@include color-white-bg;

		display: block;
		width: 100%;
		box-sizing: border-box;
		resize: none;
		max-height: 200px;

		&.--variant-block {
			border-radius: 10px;
			border: 1px solid rgba($color-black-rgb, 0.3);

			&.--size-small {
				@include text-s;
				padding: 6px 10px;

				&.--has-left-icon {
					padding-left: 36px;
				}
			}
			&.--size-medium {
				@include text-m;
				padding: 8px 14px;

				&.--has-left-icon {
					padding-left: 48px;
				}
			}
			&.--size-large {
				@include text-l;
				padding: 10px 18px;

				&.--has-left-icon {
					padding-left: 58px;
				}
			}
		}
		&.--variant-underline {
			background-color: #ffffff00;
			border-bottom: 1px solid $color-black;

			&.--size-small {
				@include text-s;
				padding: 14px 6px 5px 6px;

				&.--has-left-icon {
					padding-left: 40px;
				}
			}
			&.--size-medium {
				@include text-m;
				padding: 14px 8px 6px 8px;

				&.--has-left-icon {
					padding-left: 52px;
				}
			}
			&.--size-large {
				@include text-l;
				padding: 14px 10px 6px 10px;

				&.--has-left-icon {
					padding-left: 64px;
				}
			}
		}
	}
}
</style>
