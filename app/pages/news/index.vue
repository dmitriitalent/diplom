<script setup lang="ts">
import type { News } from "~/entities/News";
import type { byId } from "~~/server/dto/profile/byId";
import type { NewsListDtoList } from "~~/server/dto/news/newsList";
import { useAuthStore } from "~/stores/authStore";
import { jwtDecode } from "jwt-decode";

const headers = useRequestHeaders(["cookie"]);

const { at } = useAuthStore();
const isAdmin = at.value
	? (jwtDecode(at.value) as any).roles?.includes("ADMIN") ?? false
	: false;

const { data: newsPendingFetch } = isAdmin
	? await useFetch<NewsListDtoList>("/api/news/list?status=pending")
	: { data: ref(null) };

const { data: newsFetch } = await useFetch<NewsListDtoList>("/api/news/list");

const newsList = ref<Array<News>>([]);

const mapNews = async (f: NewsListDtoList["items"][number]): Promise<News> => {
	const authorFetch = await $fetch<byId>("/api/profile/byId?id=" + f.authorId, { headers });
	return {
		content: f.content,
		id: f.id,
		imageIds: f.imageIds,
		title: f.title,
		author: unwrapProfile(authorFetch),
		activityIds: f.activityIds,
		createdAt: f.createdAt,
		dormitoryId: f.dormitoryId,
		moderationComment: f.moderationComment,
		moderationStatus: f.moderationStatus,
		productIds: f.productIds,
		reactionCount: f.reactionCount,
		updatedAt: f.updatedAt,
		userReaction: f.userReaction,
		viewTemplate: f.viewTemplate,
	};
};

for (const f of newsPendingFetch.value?.items ?? []) {
	newsList.value.push(await mapNews(f));
}
for (const f of newsFetch.value?.items ?? []) {
	newsList.value.push(await mapNews(f));
}
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.container">
			<RouterLink to="/news/create">
				<UiButton accent> Создать новость </UiButton>
			</RouterLink>

			<RouterLink :to="`/news/${news.id}`" v-for="news in newsList">
				<NewsPlateComponent :news="news"></NewsPlateComponent>
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
