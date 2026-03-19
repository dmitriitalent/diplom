<script setup lang="ts">
import type { PropType } from "vue";
import type { Status } from "../types/Status";
type Variant = "block" | "underline";
type Size = "small" | "medium" | "large" | "custom";

const emit = defineEmits(["update:modelValue", "input"]);

const props = defineProps({
	modelValue: {
		type: [String, Number],
	},

	type: {
		type: String,
		default: "text",
		validator: (value: string) =>
			["text", "number", "password"].includes(value),
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

	leftIconName: {
		type: String,
	},

	status: {
		type: String as PropType<Status>,
	},
});

const classList = computed(() => {
	return [
		[`--variant-${props.variant}`],
		[`--size-${props.size}`],
		[`--status-${props.status}`],
		{ [`--has-left-icon`]: !!props.leftIconName },
	];
});

const onInput = ($event: Event) => {
	emit("update:modelValue", ($event.target as HTMLInputElement).value);
	emit("input");
};
</script>

<template>
	<div class="uiInput__wrapper">
		<Icon
			v-if="props.leftIconName !== undefined"
			:name="props.leftIconName"
			class="uiInput__leftIcon"
			:class="classList"
		></Icon>
		<input
			class="uiInput__input"
			:type="props.type"
			:value="modelValue"
			:class="classList"
			:placeholder="props.placeholder"
			@input="onInput($event)"
		/>
	</div>
</template>

<style lang="scss">
.uiInput__ {
	&wrapper {
		width: 100%;
		position: relative;
	}

	&leftIcon {
		@include color-black;

		position: absolute;
		top: 50%;
		transform: translate(0, -50%);

		&.--variant-underline {
			transform: translate(0, calc(-50% + 0.2em));
		}

		&.--size-small {
			height: 16px;
			width: 16px;
			left: 12px;
		}

		&.--size-medium {
			height: 20px;
			width: 20px;
			left: 16px;
		}

		&.--size-large {
			height: 24px;
			width: 24px;
			left: 20px;
		}
	}

	&input {
		@include reset;
		@include color-black;
		@include color-white-bg;

		width: 100%;
		box-sizing: border-box;

		padding-left: 30px;

		&.--variant-block {
			border-radius: 10px;
			border: 1px solid rgba($color-black, 0.3);

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

		&.--status-success {
			@include color-success-bg;
		}

		&.--status-warn {
			@include color-warn-bg;
		}

		&.--status-error {
			@include color-error-bg;
		}
	}
}
</style>
