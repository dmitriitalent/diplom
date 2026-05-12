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

let isAdmin = at
	? ((jwtDecode(at) as any).roles?.includes("ADMIN") ?? false)
	: false;

const { data: activitiesPendingFetch } = isAdmin
	? await useFetch<ActivityDtoList>("/api/activity/list?status=pending")
	: { data: ref(null) };

const activitiesPending = ref<Array<Activity>>([]);
const activities = ref<Array<Activity>>([]);

const { data: activitiesFetch } =
	await useFetch<ActivityDtoList>("/api/activity/list");

const mapActivity = async (
	f: ActivityDtoList["activities"][number],
): Promise<Activity> => {
	const authorFetch = await $fetch<byId>(
		"/api/profile/byId?id=" + f.createdBy,
		{
			headers: useRequestHeaders(["cookie"]),
		},
	);
	const author = unwrapProfile(authorFetch);
	return {
		author,
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
};

for (const f of activitiesPendingFetch.value?.activities ?? []) {
	activitiesPending.value.push(await mapActivity(f));
}

for (const f of activitiesFetch.value?.activities ?? []) {
	activities.value.push(await mapActivity(f));
}

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

			<template v-if="isAdmin && activitiesPending.length > 0">
				<h2 :class="$style.sectionTitle">На модерации</h2>
				<ActivityPlateComponent
					v-for="activity in activitiesPending"
					:key="activity.id"
					:activity="activity"
				></ActivityPlateComponent>
				<h2 :class="$style.sectionTitle">Все мероприятия</h2>
			</template>

			<ActivityPlateComponent
				v-for="activity in activities"
				:key="activity.id"
				:activity="activity"
			></ActivityPlateComponent>
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

	.sectionTitle {
		@include reset;
		@include title-m;
		@include color-black;

		opacity: 0.5;
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
