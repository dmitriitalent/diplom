<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { FormSelectOption } from "../types/FormSelect";

type Size = "small" | "medium" | "large" | "custom";

const props = defineProps({
	modelValue: {
		type: [String, Number] as PropType<string | number | undefined>,
	},

	size: {
		type: String as PropType<Size>,
		default: "medium",
	},

	options: {
		type: Array as PropType<FormSelectOption[]>,
		default: () => [],
	},

	placeholder: {
		type: String,
		default: "Выберите значение",
	},

	leftIconName: {
		type: String,
	},
});

const emit = defineEmits<{
	(e: "update:modelValue", value: string | number): void;
}>();

/* state */
const isOpen = ref(false);
const focusedIndex = ref(0);
const buttonRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);

/* derived */
const selectedOption = computed(() =>
	props.options.find((o) => o.value === props.modelValue)
);

const label = computed(() => selectedOption.value?.name ?? props.placeholder);

const classList = computed(() => [
	`--size-${props.size}`,
	{ "--open": isOpen.value },
	{ "--is-disable": props.options.length === 0 },
	{ "--has-left-icon": !!props.leftIconName },
]);

/* methods */
const open = () => {
	if (props.options.length === 0) {
		return;
	}

	isOpen.value = true;
	requestAnimationFrame(() => {
		listRef.value?.focus();
	});
};

const close = () => {
	isOpen.value = false;
	buttonRef.value?.focus();
};

const toggle = () => {
	isOpen.value ? close() : open();
};

const select = (option: FormSelectOption, index: number) => {
	if (option.value === undefined) return;
	emit("update:modelValue", option.value);
	focusedIndex.value = index;
	close();
};

/* keyboard */
const onButtonKeydown = (e: KeyboardEvent) => {
	if (e.key === "Enter" || e.key === " ") {
		e.preventDefault();
		open();
	}
};

const onListKeydown = (e: KeyboardEvent) => {
	switch (e.key) {
		case "ArrowDown":
			e.preventDefault();
			focusedIndex.value =
				(focusedIndex.value + 1) % props.options.length;
			break;

		case "ArrowUp":
			e.preventDefault();
			focusedIndex.value =
				(focusedIndex.value - 1 + props.options.length) %
				props.options.length;
			break;

		case "Home":
			focusedIndex.value = 0;
			break;

		case "End":
			focusedIndex.value = props.options.length - 1;
			break;

		case "Enter":
			const option = props.options[focusedIndex.value];
			if (!option) return;
			select(option, focusedIndex.value);

			break;

		case "Escape":
			close();
			break;
	}
};

/* sync focus with model */
watch(
	() => props.modelValue,
	(value) => {
		const index = props.options.findIndex((o) => o.value === value);
		if (index !== -1) focusedIndex.value = index;
	},
	{ immediate: true }
);
</script>

<template>
	<div class="uiSelect" :class="classList">
		<button
			ref="buttonRef"
			class="uiSelect__control"
			:class="classList"
			type="button"
			aria-haspopup="listbox"
			:aria-expanded="isOpen"
			@keydown="onButtonKeydown"
			@click="toggle"
		>
			<Icon
				v-if="props.leftIconName"
				:name="props.leftIconName"
				class="uiSelect__icon"
				:class="classList"
			></Icon>
			<span class="uiSelect__value"> {{ label }}</span>
			<Icon
				v-if="props.leftIconName"
				name="ic:round-keyboard-arrow-down"
				class="uiSelect__icon uiSelect__arrow"
				:class="classList"
			></Icon>
		</button>

		<UiTransition name="fade-top">
			<ul
				v-if="isOpen"
				ref="listRef"
				class="uiSelect__list"
				:class="classList"
				role="listbox"
				tabindex="-1"
				@keydown="onListKeydown"
			>
				<UiOption
					v-for="(option, index) in options"
					:key="option.value"
					:value="option.value"
					:size="size"
					:leftIconName="option.leftIconName"
					:aria-selected="option.value === modelValue"
					:data-focused="index === focusedIndex"
					@click="select(option, index)"
				>
					{{ option.name }}
				</UiOption>
			</ul>
		</UiTransition>
	</div>
</template>

<style lang="scss">
.uiSelect {
	position: relative;
	cursor: pointer;

	&__control {
		@include color-white-bg;
		@include color-black;

		width: 100%;
		border-radius: 10px;
		text-align: left;
		position: relative;
		border: none;
		border: 1px solid rgba($color-black, 0.3);
		display: flex;
		align-items: center;
		cursor: pointer;

		&.--open {
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
		}

		&.--is-disable {
			@include color-black(0.3);
		}

		transition: border-bottom-left-radius $transition,
			border-bottom-right-radius $transition;

		&.--size-small {
			@include text-s;
			padding: 6px 10px;
			padding-right: 36px;

			&.--has-left-icon {
				padding-left: 36px;
			}
		}
		&.--size-medium {
			@include text-m;
			padding: 8px 14px;
			padding-right: 48px;

			&.--has-left-icon {
				padding-left: 48px;
			}
		}
		&.--size-large {
			@include text-l;
			padding: 10px 18px;
			padding-right: 58px;

			&.--has-left-icon {
				padding-left: 58px;
			}
		}
	}

	&__icon {
		position: absolute;

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

	&__arrow {
		&.--size-small {
			height: 16px;
			width: 16px;
			left: unset;
			right: 12px;
		}

		&.--size-medium {
			height: 20px;
			width: 20px;
			left: unset;
			right: 16px;
		}

		&.--size-large {
			height: 24px;
			width: 24px;
			left: unset;
			right: 20px;
		}
	}

	&__control:focus-visible {
	}

	&__list {
		@include reset;
		@include color-white-bg;

		position: absolute;
		z-index: 1;
		width: 100%;
		border: 1px solid rgba($color-black, 0.3);
		border-top: none;
		border-bottom-left-radius: 10px;
		border-bottom-right-radius: 10px;
		overflow: hidden;
		box-sizing: border-box;

		&.--open {
			:first-child {
				border-top-left-radius: 0;
				border-top-right-radius: 0;
			}
		}
	}
}
</style>
