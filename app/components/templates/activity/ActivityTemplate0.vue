<script setup lang="ts">
import type { Cached } from "~/stores/cacheStore";
import type { Activity } from "~/entities/Activity";
import { useDevice } from "~/composables/device";

const props = defineProps<{
	activity: Cached<Activity>;
	isAdmin: boolean;
	isAuthor: boolean;
	isParticipant: boolean;
	moderateForm: { comment: string; status: string };
	inviteCode: string | null;
}>();

const emit = defineEmits<{
	(e: "delete"): void;
	(e: "edit"): void;
	(e: "join"): void;
	(e: "leave"): void;
	(e: "moderate", status: string): void;
	(e: "generate-invite", form: { maxUses: number }): void;
}>();

const { deviceClassList } = useDevice();

const expiresAt = ref<Date>();
const inviteForm = ref({ maxUses: 1 });

const formatDate = (iso?: string) => {
	if (!iso) return "";
	const d = new Date(iso);
	const dd = String(d.getDate()).padStart(2, "0");
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const yyyy = d.getFullYear();
	const hh = String(d.getHours()).padStart(2, "0");
	const min = String(d.getMinutes()).padStart(2, "0");
	return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container" v-if="activity.title">
			<div v-if="isAdmin" :class="$style.adminTools">
				<UiButton :class="$style.delete" @click="emit('delete')"
					>Удалить</UiButton
				>
				<UiButton :class="$style.edit" @click="emit('edit')"
					>Редактировать</UiButton
				>
				<UiButton
					v-if="activity.moderationStatus === 'pending'"
					:class="$style.approve"
					@click="emit('moderate', 'approved')"
					>Одобрить</UiButton
				>
				<UiButton
					v-if="activity.moderationStatus === 'pending'"
					:class="$style.decline"
					@click="emit('moderate', 'declined')"
					>Отклонить</UiButton
				>
				<UiButton
					v-if="activity.moderationStatus === 'pending'"
					:class="$style.block"
					@click="emit('moderate', 'blocked')"
					>Заблокировать пользователя</UiButton
				>
				<UiTextarea
					v-if="activity.moderationStatus === 'pending'"
					v-model="props.moderateForm.comment"
					:rows="2"
					placeholder="Комментарий принятого решения"
				/>
			</div>

			<div v-if="isAuthor && !isAdmin" :class="$style.authorTools">
				<UiButton :class="$style.delete" @click="emit('delete')"
					>Удалить</UiButton
				>
				<UiButton :class="$style.edit" @click="emit('edit')"
					>Редактировать</UiButton
				>

				<div v-if="activity.isPrivate" :class="$style.row">
					<UiButton
						:class="$style.invite"
						@click="emit('generate-invite', inviteForm)"
						>Создать приглашения</UiButton
					>
					<ClientOnly>
						<UiDatePicker
							:class="$style.expiresAt"
							enable-time
							left-icon-name=""
							placeholder="Активен до"
							v-model="expiresAt"
						/>
					</ClientOnly>
					<UiInput
						type="number"
						v-model="inviteForm.maxUses"
						placeholder="Количество"
						:class="$style.maxUses"
					/>
				</div>
				<div v-if="inviteCode" :class="$style.inviteCode">
					Код приглашения: {{ inviteCode }}
				</div>
			</div>

			<UiButton
				v-if="!isParticipant"
				:class="$style.join"
				@click="emit('join')"
				accent
			>
				Участвовать
			</UiButton>

			<UiButton
				v-if="isParticipant"
				:class="$style.remove"
				accent
				@click="emit('leave')"
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
				<RouterLink
					v-if="activity.author"
					:to="`/profile/${activity.author.id}`"
				>
					<div :class="$style.author">
						<UiImage
							:src="`/api/images/byGuid?guid=${activity.author.avatarId}`"
							:class="$style.image"
						/>
						<div :class="$style.name">
							{{ activity.author.name + " " + activity.author.surname }}
						</div>
					</div>
				</RouterLink>
				<h3 :class="$style.name">{{ activity.title }}</h3>
				<p :class="$style.description">{{ activity.description }}</p>
				<p :class="$style.place">{{ activity.location }}</p>
				<p :class="$style.place">Начало: {{ formatDate(activity.startTime) }}</p>
				<p :class="$style.place">Конец: {{ formatDate(activity.endTime) }}</p>
			</div>

			<div
				v-if="(activity.participants ?? []).length !== 0"
				:class="$style.participants"
			>
				<h2 :class="$style.title">Участники</h2>
				<div
					:class="$style.participant"
					v-for="participant in activity.participants ?? []"
					:key="participant.id"
				>
					<RouterLink
						:to="`/profile/${participant.id}`"
						:class="$style.link"
					>
						<UiImage
							:class="$style.avatar"
							:src="`/api/images/byGuid?guid=${(participant as any).avatarId}`"
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

		@include respond-to(mobile) {
			@include container(mobile);

			row-gap: 20px;
		}
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

		.edit {
			@include color-black-bg(0.08);
		}

		.row {
			display: flex;
			align-items: center;
			justify-content: space-between;

			@include respond-to(mobile) {
				flex-direction: column;
				align-items: stretch;
				row-gap: 10px;
			}

			.expiresAt {
				width: 400px;

				@include respond-to(mobile) {
					width: 100%;
				}
			}

			.maxUses {
				width: 400px;

				@include respond-to(mobile) {
					width: 100%;
				}
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

		@include respond-to(mobile) {
			height: 280px;
		}

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

			@include respond-to(mobile) {
				margin-left: 0;
			}

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

			@include respond-to(mobile) {
				@include title-m;
			}
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

			@include respond-to(mobile) {
				margin-left: 0;
			}
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
