<script setup lang="ts">
import CategoryComponent from "~/components/CategoryComponent.vue";
import type { Category } from "~/entities/Category";
import type { Product } from "~/entities/Product";
import { useCategoryStore } from "~/stores/categoryStore";
import type { byId } from "~~/server/dto/profile/byId";
import { useDevice } from "~/composables/device";

const headers = useRequestHeaders(["cookie"]);
const { deviceClassList } = useDevice();

const PAGE_SIZE = 20;

const products = ref<Array<Product>>([]);
const offset = ref(0);
const hasMore = ref(true);
const loadingMore = ref(false);

const { categories, init } = useCategoryStore();
await init();

const mapProduct = (f: any): Product => {
	const category: Category = categories?.find((c) => c.id == f.categoryId)!;
	return {
		category,
		description: f.description,
		id: f.id,
		images: f.images,
		name: f.name,
		owner: f.owner,
		price: f.price,
		publishedAt: f.publishedAt,
		status: f.status,
		updatedAt: f.updatedAt,
		viewTemplate: f.viewTemplate,
	} as Product;
};

const loadMore = async () => {
	if (loadingMore.value || !hasMore.value) return;
	loadingMore.value = true;
	try {
		const res = await $fetch<{ products: any[] }>("/api/product/list", {
			headers,
			query: { limit: PAGE_SIZE, offset: offset.value },
		});
		const items = res?.products ?? [];
		for (const f of items) {
			const ownerFetch = await $fetch<byId>(
				"/api/profile/byId?id=" + f.ownerId,
				{ headers },
			);
			products.value.push(mapProduct({ ...f, owner: unwrapProfile(ownerFetch) }));
		}
		offset.value += items.length;
		if (items.length < PAGE_SIZE) hasMore.value = false;
	} finally {
		loadingMore.value = false;
	}
};

await loadMore();
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<RouterLink to="/catalog/create">
				<UiButton accent> Создать объявление </UiButton>
			</RouterLink>

			<ProductPlateComponent
				v-for="product in products"
				:key="product.id"
				:product="product"
			></ProductPlateComponent>

			<ObserverComponent v-if="hasMore" @intersect="loadMore" />
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;

		display: flex;
		flex-direction: column;
		row-gap: 50px;

		@include respond-to(mobile) {
			@include container(mobile);

			row-gap: 24px;
		}
	}
}
</style>
