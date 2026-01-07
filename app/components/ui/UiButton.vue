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

	accent: {
		type: Boolean,
	},

	size: {
		type: String as PropType<Size>,
		default: "medium",
	},
});

const classList = computed(() => {
	return [
		{ ["--is-inset"]: props.inset },
		{ ["--is-disable"]: props.disable },
		{ ["--is-accent"]: props.accent },
		[`--size-${props.size}`],
	];
});
</script>

<template>
	<div class="uiButton__wrapper" :class="classList">
		<button class="uiButton__button">
			<slot></slot>
		</button>
	</div>
</template>

<style lang="scss">
.uiButton__ {
	@include unselectable;

	&wrapper {
		@include text-m;

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

		&:not(.--is-inset) {
			@include shadow;

			transition: box-shadow $transition-fast ease;
			border-radius: 10px;

			&:hover {
				@include shadow($set: false);
			}
		}

		&.--size-small {
			padding: 6px 12px;
		}
		&.--size-medium {
			padding: 10px 20px;
		}
		&.--size-large {
			padding: 14px 28px;
		}
	}

	&button {
		@include reset;
		@include color-black;

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
}
</style>
