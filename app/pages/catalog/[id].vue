<script setup lang="ts">
import { useAuthStore } from "~/stores/authStore";
import { useSelfStore } from "~/stores/selfStore";
import { useCacheStore } from "~/stores/cacheStore";
import CatalogTemplate0 from "~/components/templates/catalog/CatalogTemplate0.vue";
import CatalogTemplate1 from "~/components/templates/catalog/CatalogTemplate1.vue";

const route = useRoute();
const router = useRouter();

const auth = useAuthStore();
const isAdmin = auth.isAdmin;
const cacheStore = useCacheStore();
const { self } = useSelfStore();

const id = route.params.id as string;
const product = cacheStore.products.get(id);

if (import.meta.server && !product._loaded) {
	await cacheStore.products.waitLoaded(id);
}

const isOwner = computed(() => product.owner?.id === self?.id);

const templateMap = { 0: CatalogTemplate0, 1: CatalogTemplate1 } as const;

const templateComponent = computed(
	() => templateMap[(product as any).viewTemplate as 0 | 1] ?? templateMap[0],
);

const handleDelete = () => {
	$fetch("/api/product/delete?id=" + id, { method: "DELETE" }).then(() => {
		cacheStore.products.invalidate(id);
		router.push("/catalog");
	});
};

const handleEdit = () => router.push("/catalog/edit/" + product.id);
</script>

<template>
	<component
		:is="templateComponent"
		:product="product"
		:isAdmin="isAdmin"
		:isOwner="isOwner"
		@delete="handleDelete"
		@edit="handleEdit"
	/>
</template>
