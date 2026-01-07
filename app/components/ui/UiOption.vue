<script setup lang="ts">
import { computed } from "vue";

type Size = "small" | "medium" | "large" | "custom";

const props = defineProps({
	value: {
		type: [String, Number] as PropType<string | number | undefined>,
		required: true,
	},

	size: {
		type: String as PropType<Size>,
		default: "medium",
	},

	leftIconName: {
		type: String,
	},

	ariaSelected: {
		type: Boolean,
		default: false,
	},
});

const classList = computed(() => [
	`--size-${props.size}`,
	{ "--has-left-icon": !!props.leftIconName },
	{ "--selected": props.ariaSelected },
]);
</script>

<template>
	<li
		role="option"
		:aria-selected="ariaSelected"
		:class="classList"
		class="uiOption__wrapper"
		tabindex="-1"
	>
		<Icon
			v-if="props.leftIconName"
			:name="props.leftIconName"
			class="uiOption__icon"
			:class="classList"
			aria-hidden="true"
		></Icon>

		<span class="uiOption__label">
			<slot />
		</span>
	</li>
</template>

<style lang="scss">
.uiOption__ {
	&wrapper {
		@include reset;

		position: relative;
		display: flex;
		align-items: center;

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

		&[aria-selected="true"] {
		}

		&[data-focused="true"] {
		}

		&:hover {
			@include color-accent-bg;
		}
	}

	&icon {
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

	&label {
	}
}
</style>
