<script setup lang="ts">
definePageMeta({ middleware: "verified" });

useSeoMeta({
	title: "Новости",
	description:
		"Новости общежития: объявления, обновления и важные события в Hostelite.",
});

import type { News } from "~/entities/News";
import type { byId } from "~~/server/dto/profile/byId";
import type { NewsListDtoList } from "~~/server/dto/news/newsList";
import { useAuthStore } from "~/stores/authStore";
import { useDevice } from "~/composables/device";

const headers = useRequestHeaders(["cookie"]);

const { deviceClassList } = useDevice();

const auth = useAuthStore();
const isAdmin = auth.isAdmin;
const currentUserId = auth.userId;

const PAGE_SIZE = 20;

const newsPending = ref<Array<News>>([]);
const newsMyPending = ref<Array<News>>([]);
const newsList = ref<Array<News>>([]);
const offset = ref(0);
const hasMore = ref(true);
const loadingMore = ref(false);

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

if (isAdmin) {
	const pendingRes = await $fetch<NewsListDtoList>(
		"/api/news/list?status=pending",
		{ headers },
	);
	for (const f of pendingRes?.items ?? []) {
		newsPending.value.push(await mapNews(f));
	}
}

if (currentUserId) {
	const myPendingRes = await $fetch<NewsListDtoList>(
		`/api/news/list?status=pending&author_id=${currentUserId}`,
		{ headers },
	).catch(() => ({ items: [] as NewsListDtoList["items"] }));
	for (const f of myPendingRes?.items ?? []) {
		if (f.authorId === currentUserId) {
			newsMyPending.value.push(await mapNews(f));
		}
	}
}

const loadMore = async () => {
	if (loadingMore.value || !hasMore.value) return;
	loadingMore.value = true;
	try {
		const res = await $fetch<NewsListDtoList>("/api/news/list", {
			headers,
			query: { limit: PAGE_SIZE, offset: offset.value },
		});
		const items = res?.items ?? [];
		for (const f of items) {
			newsList.value.push(await mapNews(f));
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
			<RouterLink to="/news/create">
				<UiButton accent> Создать новость </UiButton>
			</RouterLink>

			<template v-if="newsMyPending.length > 0">
				<h2 :class="$style.sectionTitle">Мои предложения</h2>
				<NewsPlateComponent
					v-for="news in newsMyPending"
					:key="news.id"
					:news="news"
				></NewsPlateComponent>
			</template>

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

		.sectionTitle {
			@include reset;
			@include title-m;
			@include color-black;

			opacity: 0.5;
		}
	}
}
</style>
