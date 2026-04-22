<script setup lang="ts">
import type { Dormitory } from "~/entities/Dormitory";
import type { Activity } from "~/entities/Activity";
import type { User } from "~/entities/User";
import { useAuthStore } from "~/stores/authStore";
import { useCategoryStore } from "~/stores/categoryStore";
import { useSelfStore } from "~/stores/selfStore";
import type { ActivityDtoById } from "~~/server/dto/activity/byId";
import type { ActivityDtoParticipants } from "~~/server/dto/activity/participants";
import type { byId } from "~~/server/dto/profile/byId";
import { jwtDecode } from "jwt-decode";

const route = useRoute();
const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;

const { at } = useAuthStore();
const isAdmin = jwtDecode(at as string).roles.includes("ADMIN");

const { data: activity, error } = await useAsyncData<Activity>(
	"activity-full",
	async () => {
		const activityFetch = await $fetch<ActivityDtoById>(
			"/api/activity/byId?id=" + route.params.id,
		);

		const authorFetch = await $fetch<byId>(
			"/api/profile/byId?id=" + activityFetch.createdBy,
			{
				headers,
				credentials: "include",
			},
		);

		const author: User = {
			id:
				typeof authorFetch.id === "object"
					? authorFetch.id.value
					: authorFetch.id,
			login:
				typeof authorFetch.login === "object"
					? authorFetch.login.value
					: authorFetch.login,
			educationEmail:
				typeof authorFetch.educationEmail === "object"
					? authorFetch.educationEmail.value
					: authorFetch.educationEmail,
			birthdate: new Date(
				typeof authorFetch.birthdate === "object"
					? authorFetch.birthdate.value
					: authorFetch.birthdate,
			),
			dormitory: {} as Dormitory,
			building:
				typeof authorFetch.building === "object"
					? authorFetch.building.value
					: authorFetch.building,
			floor:
				typeof authorFetch.floor === "object"
					? authorFetch.floor.value
					: authorFetch.floor,
			room:
				typeof authorFetch.room === "object"
					? authorFetch.room.value
					: authorFetch.room,
			surname:
				typeof authorFetch.surname === "object"
					? authorFetch.surname.value
					: authorFetch.surname,
			name:
				typeof authorFetch.name === "object"
					? authorFetch.name.value
					: authorFetch.name,
			patronymic:
				typeof authorFetch.patronymic === "object"
					? authorFetch.patronymic.value
					: authorFetch.patronymic,
			contacts: [],
			friends: [],
		};

		let participants: Array<User> = [];
		if (
			activityFetch.participants &&
			activityFetch.participants.length != 0
		) {
			participants = await Promise.all(
				activityFetch.participants.map(async (p) => {
					const participantFetch = await $fetch<byId>(
						"/api/profile/byId?id=" + p.userId,
						{
							headers,
							credentials: "include",
						},
					);

					return {
						id:
							typeof participantFetch.id === "object"
								? participantFetch.id.value
								: participantFetch.id,
						login:
							typeof participantFetch.login === "object"
								? participantFetch.login.value
								: participantFetch.login,
						educationEmail:
							typeof participantFetch.educationEmail === "object"
								? participantFetch.educationEmail.value
								: participantFetch.educationEmail,
						birthdate: new Date(
							typeof participantFetch.birthdate === "object"
								? participantFetch.birthdate.value
								: participantFetch.birthdate,
						),
						dormitory: {} as Dormitory,
						building:
							typeof participantFetch.building === "object"
								? participantFetch.building.value
								: participantFetch.building,
						floor:
							typeof participantFetch.floor === "object"
								? participantFetch.floor.value
								: participantFetch.floor,
						room:
							typeof participantFetch.room === "object"
								? participantFetch.room.value
								: participantFetch.room,
						surname:
							typeof participantFetch.surname === "object"
								? participantFetch.surname.value
								: participantFetch.surname,
						name:
							typeof participantFetch.name === "object"
								? participantFetch.name.value
								: participantFetch.name,
						patronymic:
							typeof participantFetch.patronymic === "object"
								? participantFetch.patronymic.value
								: participantFetch.patronymic,
						contacts: [],
						friends: [],
					} as User;
				}),
			);
		}

		return {
			author: author,
			createdAt: activityFetch.createdAt,
			description: activityFetch.description,
			dormitoryId: activityFetch.dormitoryId,
			endTime: activityFetch.endTime,
			id: activityFetch.id,
			imageIds: activityFetch.imageIds,
			isPrivate: activityFetch.isPrivate,
			location: activityFetch.location,
			moderationComment: activityFetch.moderationComment,
			moderationStatus: activityFetch.moderationStatus,
			participants: participants,
			startTime: activityFetch.startTime,
			title: activityFetch.title,
			updatedAt: activityFetch.updatedAt,
			viewTemplate: activityFetch.viewTemplate,
		} as Activity;
	},
);

const { self } = useSelfStore();
const isAuthor = activity.value?.author.id === self?.id;

const activityVisual = ref<Activity>(
	JSON.parse(JSON.stringify(activity.value)),
);

const deleteActivity = () => {
	$fetch("/api/activity/delete?id=" + activity.value?.id, {
		method: "DELETE",
	}).then((res) => {
		useRouter().push("/activities");
	});
};

const moderateForm = ref({
	comment: "",
	status: "",
});

const moderateActivity = (status: string) => {
	moderateForm.value.status = status;
	$fetch("/api/activity/moderate?id=" + activity.value?.id, {
		body: moderateForm.value,
		method: "PUT",
		credentials: "include",
	}).then((res) => {
		activityVisual.value.moderationStatus = status;
	});
};

const expiresAt = ref<Date>();
const inviteForm = ref({
	expiresAt: "",
	maxUses: 1,
});

const inviteCode = ref(null);

const generateInvates = () => {
	inviteForm.value.expiresAt = expiresAt.value?.toISOString() as string;

	$fetch("/api/activity/invite?id=" + activity.value?.id, {
		body: inviteForm.value,
		method: "POST",
		credentials: "include",
	}).then((res: any) => {
		inviteCode.value = res.code;
	});
};

const isParticipant = computed(() => {
	return !!activityVisual.value?.participants.find((p) => {
		return p.id == self?.id;
	});
});

const joinActivity = () => {
	$fetch("/api/activity/register", {
		method: "POST",
		body: {
			id: activity.value?.id,
		},
		credentials: "include",
	}).then((res) => {
		activityVisual.value.participants.push({
			id: typeof self?.id === "object" ? self?.id.value : self?.id,
			login:
				typeof self?.login === "object"
					? self?.login.value
					: self?.login,
			educationEmail:
				typeof self?.educationEmail === "object"
					? self?.educationEmail.value
					: self?.educationEmail,
			birthdate: new Date(),
			dormitory: {} as Dormitory,
			building:
				typeof self?.building === "object"
					? self?.building.value
					: self?.building,
			floor:
				typeof self?.floor === "object"
					? self?.floor.value
					: self?.floor,
			room:
				typeof self?.room === "object" ? self?.room.value : self?.room,
			surname:
				typeof self?.surname === "object"
					? self?.surname.value
					: self?.surname,
			name:
				typeof self?.name === "object" ? self?.name.value : self?.name,
			patronymic:
				typeof self?.patronymic === "object"
					? self?.patronymic.value
					: self?.patronymic,
			contacts: [],
			friends: [],
		} as User);
	});
};

const removeParticipant = () => {
	const index = activityVisual.value.participants.findIndex((p) => {
		return p.id == self?.id;
	});

	activityVisual.value.participants = [
		...(activityVisual.value?.participants.splice(0, index) as Array<User>),
		...(activityVisual.value?.participants.splice(index) as Array<User>),
	];

	$fetch("/api/activity/unregister", {
		method: "DELETE",
		body: {
			id: activity.value?.id,
		},
		credentials: "include",
	}).then((res) => {});
};
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.container" v-if="activity">
			<div v-if="isAdmin" :class="$style.adminTools">
				<UiButton :class="$style.delete" @click="deleteActivity"
					>Удалить</UiButton
				>

				<UiButton
					v-if="activityVisual.moderationStatus === 'pending'"
					:class="$style.approve"
					@click="moderateActivity('approved')"
					>Одобрить</UiButton
				>
				<UiButton
					v-if="activityVisual.moderationStatus === 'pending'"
					:class="$style.decline"
					@click="moderateActivity('declined')"
					>Отклонить</UiButton
				>
				<UiButton
					v-if="activityVisual.moderationStatus === 'pending'"
					:class="$style.block"
					@click="moderateActivity('blocked')"
					>Заблокировать пользователя</UiButton
				>

				<UiTextarea
					v-if="activityVisual.moderationStatus === 'pending'"
					v-model="moderateForm.comment"
					:rows="2"
					placeholder="Комментарий принятого решения по отклонению/одобрению/блокированию"
				></UiTextarea>
			</div>

			<div v-if="isAuthor" :class="$style.authorTools">
				<UiButton
					v-if="!isAdmin"
					:class="$style.delete"
					@click="deleteActivity"
					>Удалить</UiButton
				>

				<div v-if="activity.isPrivate" :class="$style.row">
					<UiButton :class="$style.invite" @click="generateInvates"
						>Создать приглашения</UiButton
					>

					<ClientOnly>
						<UiDatePicker
							:class="$style.expiresAt"
							enable-time
							left-icon-name=""
							placeholder="Активен до"
							v-model="expiresAt"
						></UiDatePicker>
					</ClientOnly>

					<UiInput
						type="number"
						placeholder="Количество"
						:class="$style.maxUses"
					></UiInput>
				</div>
				<div v-if="inviteCode" :class="$style.inviteCode">
					Код приглашения: {{ inviteCode }}
				</div>
			</div>

			<UiButton
				v-if="!isParticipant"
				:class="$style.join"
				@click="joinActivity"
				accent
			>
				Участвовать
			</UiButton>

			<UiButton
				v-if="isParticipant"
				:class="$style.remove"
				accent
				@click="removeParticipant"
			>
				Выйти из участия
			</UiButton>

			<div :class="$style.top">
				<UiGallery :class="$style.gallery" :autoplay="3000" loop>
					<template
						v-for="(image, index) in activity.imageIds"
						:key="index"
						v-slot:[index]
					>
						<img
							:class="$style.image"
							:src="`/api/images/byGuid?guid=${image}`"
						/>
					</template>
				</UiGallery>
			</div>

			<div :class="$style.bottom">
				<RouterLink :to="`/profile/${activity.author.id}`">
					<div :class="$style.author">
						<img
							:src="`/api/images/byGuid?guid=avatar`"
							:class="$style.image"
						/>
						<div :class="$style.name">
							{{
								activity.author.name +
								" " +
								activity.author.surname
							}}
						</div>
					</div>
				</RouterLink>
				<h3 :class="$style.name">{{ activity.title }}</h3>
				<p :class="$style.description">{{ activity.description }}</p>
				<p :class="$style.place">{{ activity.location }}</p>
				<p :class="$style.place">
					Начало:
					{{
						(String(new Date(activity.startTime).getDay()).length ==
						1
							? "0" +
								String(new Date(activity.startTime).getDay())
							: String(new Date(activity.startTime).getDay())) +
						"." +
						(String(new Date(activity.startTime).getMonth())
							.length == 1
							? "0" +
								String(
									new Date(activity.startTime).getMonth() + 1,
								)
							: String(new Date(activity.startTime).getMonth()) +
								1) +
						"." +
						String(new Date(activity.startTime).getFullYear())
					}}
					-
					{{
						(String(new Date(activity.startTime).getHours())
							.length == 1
							? "0" +
								String(new Date(activity.startTime).getHours())
							: String(new Date(activity.startTime).getHours())) +
						":" +
						(String(new Date(activity.startTime).getMinutes())
							.length == 1
							? "0" +
								String(
									new Date(activity.startTime).getMinutes(),
								)
							: String(
									new Date(activity.startTime).getMinutes(),
								)) +
						":00"
					}}
				</p>
				<p :class="$style.place">
					Конец:
					{{
						(String(new Date(activity.endTime).getDay()).length == 1
							? "0" + String(new Date(activity.endTime).getDay())
							: String(new Date(activity.endTime).getDay())) +
						"." +
						(String(new Date(activity.endTime).getMonth()).length ==
						1
							? "0" +
								String(
									new Date(activity.endTime).getMonth() + 1,
								)
							: String(new Date(activity.endTime).getMonth()) +
								1) +
						"." +
						String(new Date(activity.endTime).getFullYear())
					}}
					-
					{{
						(String(new Date(activity.endTime).getHours()).length ==
						1
							? "0" +
								String(new Date(activity.endTime).getHours())
							: String(new Date(activity.endTime).getHours())) +
						":" +
						(String(new Date(activity.endTime).getMinutes())
							.length == 1
							? "0" +
								String(new Date(activity.endTime).getMinutes())
							: String(new Date(activity.endTime).getMinutes())) +
						":00"
					}}
				</p>
			</div>

			<div
				v-if="activityVisual.participants.length != 0"
				:class="$style.participants"
			>
				<h2 :class="$style.title">Участники</h2>
				<div
					:class="$style.participant"
					v-for="participant in activityVisual.participants"
				>
					<RouterLink
						:to="`/profile/${participant.id}`"
						:class="$style.link"
					>
						<img
							:class="$style.avatar"
							:src="`/api/images/byGuid?guid=avatar`"
						/>
						<div :class="$style.name">
							{{ participant.name + " " + participant.surname }}
						</div>
					</RouterLink>
				</div>
			</div>
		</div>
	</div>
</template>
<style module lang="scss">
.wrapper {
	.container {
		@include container;

		display: flex;
		flex-direction: column;
		row-gap: 30px;
	}

	display: flex;
	column-gap: 30px;
	position: relative;

	.adminTools,
	.authorTools {
		display: flex;
		flex-direction: column;
		row-gap: 10px;

		.delete,
		.block {
			@include color-error-bg;
		}

		.approve {
			@include color-success-bg;
		}

		.decline {
			@include color-warn-bg;
		}

		.row {
			display: flex;
			align-items: center;
			justify-content: space-between;

			.expiresAt {
				width: 400px;
			}

			.maxUses {
				width: 400px;
			}
		}

		.inviteCode {
			@include text-m;
			@include color-black;
			@include color-success-bg;

			width: 100%;
			padding: 10px;
		}
	}

	.top {
		width: 100%;
		height: 600px;

		.gallery {
			@include color-black-bg(0.1);

			height: 100%;
			border-radius: 10px;

			.image {
				width: 100%;
				height: 100%;
				object-fit: contain;
			}
		}
	}

	.bottom {
		display: flex;
		flex-direction: column;
		row-gap: 30px;

		.author {
			width: fit-content;
			margin-left: auto;
			display: flex;
			align-items: center;
			column-gap: 20px;

			.image {
				width: 50px;
				height: 50px;
				border-radius: 100%;
			}

			.name {
				@include title-m;
			}
		}

		.name {
			@include reset;
			@include title-l;
			@include color-black;
		}

		.description {
			@include reset;
			@include text-l;
			@include color-black;

			text-indent: 1em;
		}

		.place {
			@include reset;
			@include text-l;
			@include color-black;

			margin-left: auto;
		}
	}

	.participants {
		display: flex;
		flex-direction: column;
		row-gap: 10px;

		.title {
			@include reset;
			@include title-m;
			@include color-black;
		}

		.participant {
			display: flex;
			align-items: center;
			justify-content: space-between;
			transition: $transition-fast;
			padding: 5px;
			border-radius: 10px;

			&:hover {
				@include color-black-bg(0.1);
			}

			.link {
				display: flex;
				column-gap: 20px;
				align-items: center;

				.avatar {
					height: 50px;
					width: 50px;
					border-radius: 100%;
				}

				.name {
					@include text-m;
					@include color-black;
				}
			}
		}
	}
}
</style>
