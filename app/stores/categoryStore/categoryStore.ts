import type { Category } from "~/entities/Category";
import type { CategoriesDtoGetList } from "~~/server/dto/category/getList";

export const useCategoryStore = defineStore("categoryStore", () => {
	const categories: Ref<Array<Category>> = ref([]);

	const init = async () => {
		if (categories.value.length != 0) {
			return;
		}

		const categoriesDto =
			await $fetch<CategoriesDtoGetList>("/api/category/list");

		const map = new Map<string, Category>();

		categoriesDto.categories.forEach((item) => {
			map.set(item.id, {
				id: item.id,
				name: item.name,
				slug: item.slug,
				children: [],
			});
		});

		const tree: Category[] = [];

		categoriesDto.categories.forEach((item) => {
			const node = map.get(item.id)!;

			if (item.parentId && map.has(item.parentId)) {
				map.get(item.parentId)!.children.push(node);
			} else {
				tree.push(node);
			}
		});

		categories.value = tree;
	};

	return {
		categories,
		init,
	};
});
