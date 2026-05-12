<script setup lang="ts">
import { useAuthStore } from "~/stores/authStore";
import { useSelfStore } from "~/stores/selfStore";
import { useCacheStore } from "~/stores/cacheStore";
import { jwtDecode } from "jwt-decode";

const route = useRoute();
const router = useRouter();

const { at } = useAuthStore();
const isAdmin = jwtDecode(at as string).roles.includes("ADMIN");
const cacheStore = useCacheStore();
const { self } = useSelfStore();

const id = route.params.id as string;
const product = cacheStore.products.get(id);

if (import.meta.server && !product._loaded) {
	await cacheStore.products.waitLoaded(id);
}

const isOwner = computed(() => product.owner?.id === self?.id);

const templateMap: Record<number, ReturnType<typeof defineAsyncComponent>> = {
	0: defineAsyncComponent(() => import("~/components/templates/catalog/CatalogTemplate0.vue")),
	1: defineAsyncComponent(() => import("~/components/templates/catalog/CatalogTemplate1.vue")),
};

const templateComponent = computed(() => templateMap[(product as any).viewTemplate ?? 0] ?? templateMap[0]);

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
