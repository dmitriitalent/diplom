<script setup lang="ts">
import type { PropType } from "vue";
type Size = "small" | "medium" | "large" | "custom";

const props = defineProps({
	inset: {
		type: Boolean,
	},

	disable: {
		type: Boolean,
	},

	disabled: {
		type: Boolean,
	},

	accent: {
		type: Boolean,
	},

	size: {
		type: String as PropType<Size>,
		default: "medium",
	},

	type: {
		type: String,
		default: "button",
	},

	unset: {
		type: Boolean,
	},
});

const isDisabled = computed(() => props.disable || props.disabled);

const { isDark } = useTheme();

const classList = computed(() => {
	return [
		{ ["--is-inset"]: props.inset },
		{ ["--is-disable"]: isDisabled.value },
		{ ["--is-accent"]: props.accent },
		{ ["--is-unset"]: props.unset },
		{ ["--is-dark"]: isDark.value },
		[`--size-${props.size}`],
	];
});
</script>

<template>
	<div class="uiButton__wrapper" :class="classList">
		<button class="uiButton__button" :type="props.type" :disabled="isDisabled">
			<slot></slot>
		</button>
	</div>
</template>

<style lang="scss">
.uiButton__ {
	@include unselectable;

	&wrapper {
		@include text-s;

		&.--is-disable {
			opacity: 0.5;
			pointer-events: none;
		}

		&.--is-accent {
			@include color-accent-bg;
		}

		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-sizing: border-box;

		&:not(.--is-inset) {
			@include shadow;

			transition: box-shadow $transition-fast ease;
			border-radius: 8px;

			&:hover {
				@include shadow($set: false);
			}
		}

		&.--size-small {
			padding: 4px 8px;
			font-size: 11px;
		}
		&.--size-medium {
			padding: 6px 14px;
		}
		&.--size-large {
			padding: 10px 20px;
			font-size: 15px;
		}
	}

	&button {
		@include reset;
		@include unselectable;
		@include color-black;

		width: 100%;
		height: 100%;
		display: flex;
		column-gap: 10px;
		align-items: center;
		justify-content: center;

		font-size: inherit;
		font-family: inherit;
		font-weight: inherit;
		text-indent: inherit;
		line-height: inherit;
		background-color: #ffffff00;

		cursor: pointer;
	}

	// В тёмной теме «чёрный» становится светло-кремовым, поэтому на акцент-фоне
	// (он жёлтый в обеих темах) текст оказывается нечитаемым. Здесь
	// принудительно используем «белую» переменную, которая в dark-режиме как
	// раз и есть тёмно-коричневая.
	&wrapper.--is-dark.--is-accent &button {
		@include color-white;
	}
}
</style>
