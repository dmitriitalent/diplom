<script setup lang="ts">
import type { Dormitory } from "~/entities/Dormitory";
import type { News } from "~/entities/News";
import type { User } from "~/entities/User";
import type { byId } from "~~/server/dto/profile/byId";
import type { NewsListDtoList } from "~~/server/dto/news/newsList";

const { data: newsPendingFetch } = await useFetch<NewsListDtoList>(
	"/api/news/list?status=pending",
);

const { data: newsFetch } = await useFetch<NewsListDtoList>("/api/news/list");

const newsList = ref<Array<News>>([]);

newsPendingFetch.value?.items.forEach(async (f) => {
	const authorFetch = await $fetch<byId>(
		"/api/profile/byId?id=" + f.authorId,
		{
			headers: useRequestHeaders(["cookie"]),
		},
	);

	const author: User = {
		id: authorFetch.id,
		login: authorFetch.login,
		educationEmail: authorFetch.educationEmail,
		birthdate: new Date(authorFetch.birthdate),
		dormitory: {} as Dormitory,
		building: authorFetch.building,
		floor: authorFetch.floor,
		room: authorFetch.room,
		surname: authorFetch.surname,
		name: authorFetch.name,
		patronymic: authorFetch.patronymic,
		contacts: [],
		friends: [],
	};

	const news: News = {
		content: f.content,
		id: f.id,
		imageIds: f.imageIds,
		title: f.title,
		author: author,
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

	newsList.value.push(news);
});

newsFetch.value?.items.forEach(async (f) => {
	const authorFetch = await $fetch<byId>(
		"/api/profile/byId?id=" + f.authorId,
		{
			headers: useRequestHeaders(["cookie"]),
		},
	);

	const author: User = {
		id: authorFetch.id,
		login: authorFetch.login,
		educationEmail: authorFetch.educationEmail,
		birthdate: new Date(authorFetch.birthdate),
		dormitory: {} as Dormitory,
		building: authorFetch.building,
		floor: authorFetch.floor,
		room: authorFetch.room,
		surname: authorFetch.surname,
		name: authorFetch.name,
		patronymic: authorFetch.patronymic,
		contacts: [],
		friends: [],
	};

	const news: News = {
		content: f.content,
		id: f.id,
		imageIds: f.imageIds,
		title: f.title,
		author: author,
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

	newsList.value.push(news);
});
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
