<script setup lang="ts">
import { useAuthStore } from "~/stores/authStore";
import { useSelfStore } from "~/stores/selfStore";
import { useCacheStore } from "~/stores/cacheStore";
import { jwtDecode } from "jwt-decode";

const route = useRoute();
const router = useRouter();

const { at } = useAuthStore();
const { self } = useSelfStore();
const isAdmin = jwtDecode(at as string).roles.includes("ADMIN");
const cacheStore = useCacheStore();

const id = route.params.id as string;
const news = cacheStore.news.get(id);

if (import.meta.server && !news._loaded) {
	await cacheStore.news.waitLoaded(id);
}

const moderationStatus = ref(news.moderationStatus ?? "approved");

const isAuthor = computed(() => news.author?.id === self?.id);

const templateMap: Record<number, ReturnType<typeof defineAsyncComponent>> = {
	0: defineAsyncComponent(() => import("~/components/templates/news/NewsTemplate0.vue")),
	1: defineAsyncComponent(() => import("~/components/templates/news/NewsTemplate1.vue")),
};

const templateComponent = computed(() => templateMap[(news as any).viewTemplate ?? 0] ?? templateMap[0]);

const moderateForm = ref({ comment: "", status: "" });

const handleDelete = () => {
	$fetch("/api/news/delete?id=" + id, { method: "DELETE" }).then(() => {
		cacheStore.news.invalidate(id);
		router.push("/news");
	});
};

const handleEdit = () => router.push("/news/edit/" + news.id);

const handleModerate = (status: string) => {
	moderateForm.value.status = status;
	$fetch("/api/news/moderate?id=" + id, {
		body: moderateForm.value,
		method: "PUT",
		credentials: "include",
	}).then(() => {
		moderationStatus.value = status;
	});
};
</script>

<template>
	<component
		:is="templateComponent"
		:news="news"
		:isAdmin="isAdmin"
		:isAuthor="isAuthor"
		:moderateForm="moderateForm"
		:moderationStatus="moderationStatus"
		@delete="handleDelete"
		@edit="handleEdit"
		@moderate="handleModerate"
	/>
</template>
