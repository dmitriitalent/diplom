<script setup lang="ts">
import CategoryComponent from "~/components/CategoryComponent.vue";
import type { Category } from "~/entities/Category";
import type { Dormitory } from "~/entities/Dormitory";
import type { Product } from "~/entities/Product";
import type { User } from "~/entities/User";
import { useCategoryStore } from "~/stores/categoryStore";
import type { byId } from "~~/server/dto/profile/byId";

const { data: productsFetch } = await useFetch("/api/product/list");

const products = ref<Array<Product>>([]);

const { categories, init } = useCategoryStore();
await init();

productsFetch.value?.products.forEach(async (f) => {
	const category: Category = categories?.find((c) => c.id == f.categoryId)!;

	const ownerFetch = await $fetch<byId>("/api/profile/byId?id=" + f.ownerId, {
		headers: useRequestHeaders(["cookie"]),
	});

	const owner: User = {
		id: ownerFetch.id,
		login: ownerFetch.login,
		educationEmail: ownerFetch.educationEmail,
		birthdate: new Date(ownerFetch.birthdate),
		dormitory: {} as Dormitory,
		building: ownerFetch.building,
		floor: ownerFetch.floor,
		room: ownerFetch.room,
		surname: ownerFetch.surname,
		name: ownerFetch.name,
		patronymic: ownerFetch.patronymic,
		contacts: [],
		friends: [],
	};

	const product: Product = {
		category: category,
		description: f.description,
		id: f.id,
		images: f.images,
		name: f.name,
		owner: owner,
		price: f.price,
		publishedAt: f.publishedAt,
		status: f.status,
		updatedAt: f.updatedAt,
		viewTemplate: f.viewTemplate,
	};

	products.value.push(product);
});
</script>

<template>
	<div :class="$style.wrapper">
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
	}
}
</style>
