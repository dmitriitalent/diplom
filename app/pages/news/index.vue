<script setup lang="ts">
definePageMeta({ middleware: "verified" });

import type { News } from "~/entities/News";
import type { byId } from "~~/server/dto/profile/byId";
import type { NewsListDtoList } from "~~/server/dto/news/newsList";
import { useAuthStore } from "~/stores/authStore";
import { useDevice } from "~/composables/device";

const headers = useRequestHeaders(["cookie"]);

const { deviceClassList } = useDevice();

const auth = useAuthStore();
const isAdmin = auth.isAdmin;

const { data: newsPendingFetch } = isAdmin
	? await useFetch<NewsListDtoList>("/api/news/list?status=pending")
	: { data: ref(null) };

const { data: newsFetch } = await useFetch<NewsListDtoList>("/api/news/list");

const newsPending = ref<Array<News>>([]);
const newsList = ref<Array<News>>([]);

const mapNews = async (f: NewsListDtoList["items"][number]): Promise<News> => {
	const authorFetch = await $fetch<byId>(
		"/api/profile/byId?id=" + f.authorId,
		{ headers },
	);
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
	newsPending.value.push(await mapNews(f));
}
for (const f of newsFetch.value?.items ?? []) {
	newsList.value.push(await mapNews(f));
}
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<RouterLink to="/news/create">
				<UiButton accent> Создать новость </UiButton>
			</RouterLink>

			<template v-if="isAdmin && newsPending.length > 0">
				<h2 :class="$style.sectionTitle">На модерации</h2>
				<NewsPlateComponent
					v-for="news in newsPending"
					:key="news.id"
					:news="news"
				></NewsPlateComponent>
				<h2 :class="$style.sectionTitle">Все новости</h2>
			</template>

			<NewsPlateComponent
				v-for="news in newsList"
				:key="news.id"
				:news="news"
			></NewsPlateComponent>
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

		.sectionTitle {
			@include reset;
			@include title-m;
			@include color-black;

			opacity: 0.5;
		}
	}
}
</style>
