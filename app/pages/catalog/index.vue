<script setup lang="ts">
import CategoryComponent from "~/components/CategoryComponent.vue";
import type { Category } from "~/entities/Category";
import type { Product } from "~/entities/Product";
import { useCategoryStore } from "~/stores/categoryStore";
import type { byId } from "~~/server/dto/profile/byId";
import { useDevice } from "~/composables/device";

const headers = useRequestHeaders(["cookie"]);
const { deviceClassList } = useDevice();

const { data: productsFetch } = await useFetch("/api/product/list");

const products = ref<Array<Product>>([]);

const { categories, init } = useCategoryStore();
await init();

for (const f of productsFetch.value?.products ?? []) {
	const category: Category = categories?.find((c) => c.id == f.categoryId)!;

	const ownerFetch = await $fetch<byId>("/api/profile/byId?id=" + f.ownerId, { headers });

	const product: Product = {
		category: category,
		description: f.description,
		id: f.id,
		images: f.images,
		name: f.name,
		owner: unwrapProfile(ownerFetch),
		price: f.price,
		publishedAt: f.publishedAt,
		status: f.status,
		updatedAt: f.updatedAt,
		viewTemplate: f.viewTemplate,
	};

	products.value.push(product);
}
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<RouterLink to="/catalog/create">
				<UiButton accent> Создать объявление </UiButton>
			</RouterLink>

			<RouterLink
				:to="`/catalog/${product.id}`"
				v-for="product in products"
			>
				<ProductPlateComponent
					:product="product"
				></ProductPlateComponent>
			</RouterLink>
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
