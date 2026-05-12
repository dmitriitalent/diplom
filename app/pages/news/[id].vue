<script setup lang="ts">
definePageMeta({ middleware: "verified" });

import { useAuthStore } from "~/stores/authStore";
import { useSelfStore } from "~/stores/selfStore";
import { useCacheStore } from "~/stores/cacheStore";
import NewsTemplate0 from "~/components/templates/news/NewsTemplate0.vue";
import NewsTemplate1 from "~/components/templates/news/NewsTemplate1.vue";

const route = useRoute();
const router = useRouter();

const auth = useAuthStore();
const { self } = useSelfStore();
const isAdmin = auth.isAdmin;
const cacheStore = useCacheStore();

const id = route.params.id as string;
const news = cacheStore.news.get(id);

if (import.meta.server && !news._loaded) {
	await cacheStore.news.waitLoaded(id);
}

const moderationStatus = ref(news.moderationStatus ?? "approved");

const isAuthor = computed(() => news.author?.id === self?.id);

const templateMap = { 0: NewsTemplate0, 1: NewsTemplate1 } as const;

const templateComponent = computed(
	() => templateMap[(news as any).viewTemplate as 0 | 1] ?? templateMap[0],
);

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
