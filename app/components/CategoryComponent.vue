<script setup lang="ts">
import type { Category } from "~/entities/Category";

const props = defineProps({
	categories: {
		type: Array<Category>,
		required: true,
	},
});

const emit = defineEmits(["change"]);

const categorySelected = ref<Category>({
	id: "",
	name: "Категории",
	children: props.categories as Array<Category>,
	slug: "",
});

const onCategoryClick = (category: Category, index: number) => {
	if (index > categoryNode.value.length) {
		categoryNode.value.push(category);
	} else {
		categoryNode.value = categoryNode.value.splice(0, index + 1);
	}

	categorySelected.value = category;

	if (index == 0) {
		categorySelected.value = {
			id: "",
			name: "Категории",
			children: props.categories as Array<Category>,
			slug: "",
		};
	}

	emit("change", categorySelected.value);
};

const categoryNode = ref<Array<Category>>([categorySelected.value]);
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.path">
			<div v-for="(node, index) in categoryNode" :class="$style.node">
				<UiButton @click="onCategoryClick(node, index)" inset>
					{{ node.name }}
				</UiButton>
				<icon
					v-if="index != categoryNode.length - 1"
					name="material-symbols:chevron-right"
				></icon>
			</div>
		</div>

		<div :class="$style.list">
			<template v-if="categorySelected?.children.length > 0">
				<UiButton
					v-for="category in categorySelected?.children"
					inset
					:class="$style.button"
					@click="onCategoryClick(category, categoryNode.length + 1)"
				>
					{{ category.name }}
				</UiButton>
			</template>
			<template v-else>
				<UiButton
					inset
					:class="$style.backButton"
					@click="
						onCategoryClick(
							categoryNode[categoryNode.length - 2]!,
							categoryNode.length - 2,
						)
					"
				>
					Вернуться назад
				</UiButton>
			</template>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	display: flex;
	flex-direction: column;
	row-gap: 10px;

	.path {
		display: flex;

		.node {
			display: flex;
			align-items: center;
		}
	}

	.list {
		display: flex;
		flex-wrap: wrap;
		border-top: 1px dashed rgba($color-black, 0.3);
		padding-top: 10px;

		.button {
			width: fit-content;
		}

		.backButton {
			width: fit-content;
			margin-left: auto;
		}
	}
}
</style>
