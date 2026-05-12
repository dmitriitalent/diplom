<script setup lang="ts">
import type { Activity } from "~/entities/Activity";
import type { Dormitory } from "~/entities/Dormitory";
import type { User } from "~/entities/User";
import type { byId } from "~~/server/dto/profile/byId";
import type { ActivityDtoList } from "~~/server/dto/activity/list";
import { useAuthStore } from "~/stores/authStore";
import { jwtDecode } from "jwt-decode";
import { useDevice } from "~/composables/device";

const { deviceClassList } = useDevice();

const { at } = useAuthStore();

let isAdmin = at.value
	? ((jwtDecode(at.value) as any).roles?.includes("ADMIN") ?? false)
	: false;

const { data: activitiesPendingFetch } = isAdmin
	? await useFetch<ActivityDtoList>("/api/activity/list?status=pending")
	: { data: ref(null) };

const activities = ref<Array<Activity>>([]);

const { data: activitiesFetch } =
	await useFetch<ActivityDtoList>("/api/activity/list");

activitiesPendingFetch.value?.activities.forEach(async (f) => {
	const authorFetch = await $fetch<byId>(
		"/api/profile/byId?id=" + f.createdBy,
		{
			headers: useRequestHeaders(["cookie"]),
		},
	);

	const author = unwrapProfile(authorFetch);

	const activity: Activity = {
		author: author,
		createdAt: f.createdAt,
		description: f.description,
		dormitoryId: f.dormitoryId,
		endTime: f.endTime,
		id: f.id,
		imageIds: f.imageIds,
		isPrivate: f.isPrivate,
		location: f.location,
		moderationComment: f.moderationComment,
		moderationStatus: f.moderationStatus,
		participants: f.participants,
		startTime: f.startTime,
		title: f.title,
		updatedAt: f.updatedAt,
		viewTemplate: f.viewTemplate,
	};

	activities.value.push(activity);
});

activitiesFetch.value?.activities.forEach(async (f) => {
	const authorFetch = await $fetch<byId>(
		"/api/profile/byId?id=" + f.createdBy,
		{
			headers: useRequestHeaders(["cookie"]),
		},
	);

	const author = unwrapProfile(authorFetch);

	const activity: Activity = {
		author: author,
		createdAt: f.createdAt,
		description: f.description,
		dormitoryId: f.dormitoryId,
		endTime: f.endTime,
		id: f.id,
		imageIds: f.imageIds,
		isPrivate: f.isPrivate,
		location: f.location,
		moderationComment: f.moderationComment,
		moderationStatus: f.moderationStatus,
		participants: f.participants,
		startTime: f.startTime,
		title: f.title,
		updatedAt: f.updatedAt,
		viewTemplate: f.viewTemplate,
	};

	activities.value.push(activity);
});

const inviteCode = ref<string>("");
const joinError = ref(false);

const joinByCode = () => {
	$fetch("/api/activity/join", {
		method: "POST",
		body: {
			code: inviteCode.value,
		},
	})
		.then((res: any) => {
			useRouter().push(`/activities/${res.activityId}`);
		})
		.catch((err) => {
			joinError.value = true;
		});
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<RouterLink to="/activities/create">
				<UiButton accent>Создать мероприятие</UiButton>
			</RouterLink>

			<div :class="$style.row">
				<UiButton
					:class="[$style.join, joinError ? '--is-error' : '']"
					@click="joinByCode"
					>Присоединиться</UiButton
				>
				<UiInput
					v-model="inviteCode"
					@input="joinError = false"
					placeholder="Код приглашения"
					:class="[$style.inviteCode, joinError ? '--is-error' : '']"
				></UiInput>
			</div>

			<RouterLink
				:to="`/activities/${activity.id}`"
				v-for="activity in activities"
			>
				<ActivityPlateComponent
					:activity="activity"
				></ActivityPlateComponent>
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

	.row {
		display: flex;
		justify-content: space-between;
		column-gap: 20px;
		align-items: center;

		@include respond-to(mobile) {
			flex-direction: column;
			align-items: stretch;
			row-gap: 10px;
		}

		.join {
			&:global(.--is-error) {
				@include color-error-bg;
			}
		}

		.inviteCode {
			&:global(.--is-error) :global(.uiInput__input) {
				@include color-error-bg;
			}
		}
	}
}
</style>
