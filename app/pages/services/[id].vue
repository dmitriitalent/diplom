<script setup lang="ts">
import type { Dormitory } from "~/entities/Dormitory";
import type { Service, ServiceComment } from "~/entities/Service";
import type { User } from "~/entities/User";
import { useAuthStore } from "~/stores/authStore";
import { useSelfStore } from "~/stores/selfStore";
import type { ServiceDtoById } from "~~/server/dto/service/byId";
import type { ServiceCommentsListDto } from "~~/server/dto/service/comment";
import type { byId } from "~~/server/dto/profile/byId";
import { jwtDecode } from "jwt-decode";

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;
const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;

const { at } = useAuthStore();
const { self } = useSelfStore();
const isAdmin = jwtDecode(at as string).roles.includes("ADMIN");

const mapProfile = (p: byId): User => ({
	id: typeof p.id === "object" ? p.id.value : p.id,
	login: typeof p.login === "object" ? p.login.value : p.login,
	educationEmail:
		typeof p.educationEmail === "object"
			? p.educationEmail.value
			: p.educationEmail,
	birthdate: new Date(
		typeof p.birthdate === "object" ? p.birthdate.value : p.birthdate,
	),
	dormitory: {} as Dormitory,
	building: typeof p.building === "object" ? p.building.value : p.building,
	floor: typeof p.floor === "object" ? p.floor.value : p.floor,
	room: typeof p.room === "object" ? p.room.value : p.room,
	surname: typeof p.surname === "object" ? p.surname.value : p.surname,
	name: typeof p.name === "object" ? p.name.value : p.name,
	patronymic:
		typeof p.patronymic === "object" ? p.patronymic.value : p.patronymic,
	contacts: [],
	friends: [],
});

const { data: service } = await useAsyncData<Service>(
	"service-" + id,
	async () => {
		const s = await $fetch<ServiceDtoById>("/api/service/byId?id=" + id);
		const ownerFetch = await $fetch<byId>(
			"/api/profile/byId?id=" + s.ownerId,
			{
				headers,
				credentials: "include",
			},
		);
		return {
			id: s.id,
			name: s.name,
			description: s.description,
			images: s.images,
			owner: mapProfile(ownerFetch),
			price: s.price,
			publishedAt: s.publishedAt,
			status: s.status,
			updatedAt: s.updatedAt,
			viewTemplate: s.viewTemplate,
		} as Service;
	},
);

const { data: commentsData } = await useAsyncData<ServiceComment[]>(
	"service-comments-" + id,
	async () => {
		const res = await $fetch<ServiceCommentsListDto>(
			"/api/service/comments?id=" + id,
		);
		return await Promise.all(
			(res.comments ?? []).map(async (c) => {
				const authorFetch = await $fetch<byId>(
					"/api/profile/byId?id=" + c.authorId,
					{ headers, credentials: "include" },
				);
				return {
					id: c.id,
					listingId: c.listingId,
					authorId: c.authorId,
					author: mapProfile(authorFetch),
					body: c.body,
					publishedAt: c.publishedAt,
					updatedAt: c.updatedAt,
				} as ServiceComment;
			}),
		);
	},
);

const comments = ref<ServiceComment[]>(commentsData.value ?? []);

const isOwner = service.value?.owner.id === self?.id;
const canEdit = isAdmin || isOwner;

const deleteService = () => {
	$fetch("/api/service/delete?id=" + id, { method: "DELETE" }).then(() => {
		router.push("/services");
	});
};

const commentBody = ref("");
const submittingComment = ref(false);

const addComment = async () => {
	if (!commentBody.value.trim()) return;
	submittingComment.value = true;
	try {
		const res = await $fetch<{
			id: string;
			authorId: string;
			body: string;
			publishedAt: string;
			updatedAt: string;
			listingId: string;
		}>("/api/service/comments?id=" + id, {
			method: "POST",
			body: { body: commentBody.value },
		});
		comments.value.push({
			id: res.id,
			listingId: res.listingId,
			authorId: res.authorId,
			author: {
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
					typeof self?.room === "object"
						? self?.room.value
						: self?.room,
				surname:
					typeof self?.surname === "object"
						? self?.surname.value
						: self?.surname,
				name:
					typeof self?.name === "object"
						? self?.name.value
						: self?.name,
				patronymic:
					typeof self?.patronymic === "object"
						? self?.patronymic.value
						: self?.patronymic,
				contacts: [],
				friends: [],
			} as User,
			body: res.body,
			publishedAt: res.publishedAt,
			updatedAt: res.updatedAt,
		});
		commentBody.value = "";
	} finally {
		submittingComment.value = false;
	}
};
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.container" v-if="service">
			<div v-if="canEdit" :class="$style.ownerTools">
				<UiButton :class="$style.delete" @click="deleteService"
					>Удалить</UiButton
				>
				<UiButton
					:class="$style.edit"
					@click="router.push('/services/edit/' + service.id)"
					>Редактировать</UiButton
				>
			</div>

			<div :class="$style.top">
				<UiGallery :class="$style.gallery" :autoplay="3000" loop>
					<template
						v-for="(image, index) in service.images"
						:key="index"
						v-slot:[index]
					>
						<img
							:class="$style.image"
							:src="`/api/images/byGuid?guid=${image.fileGuid}`"
						/>
					</template>
				</UiGallery>
			</div>

			<div :class="$style.bottom">
				<RouterLink :to="`/profile/${service.owner.id}`">
					<div :class="$style.owner">
						<img
							:src="`/api/images/byGuid?guid=avatar`"
							:class="$style.avatar"
						/>
						<div :class="$style.ownerName">
							{{ service.owner.name }} {{ service.owner.surname }}
						</div>
					</div>
				</RouterLink>

				<h3 :class="$style.name">{{ service.name }}</h3>
				<p :class="$style.description">{{ service.description }}</p>
				<div :class="$style.price">{{ service.price }} ₽</div>
			</div>

			<div :class="$style.commentsSection">
				<h2 :class="$style.commentsTitle">Комментарии</h2>

				<div
					v-for="comment in comments"
					:key="comment.id"
					:class="$style.comment"
				>
					<RouterLink
						:to="`/profile/${comment.authorId}`"
						:class="$style.commentAuthor"
					>
						<img
							:src="`/api/images/byGuid?guid=avatar`"
							:class="$style.commentAvatar"
						/>
						<span :class="$style.commentAuthorName">
							{{ comment.author?.name }}
							{{ comment.author?.surname }}
						</span>
					</RouterLink>
					<p :class="$style.commentBody">{{ comment.body }}</p>
					<span :class="$style.commentDate">
						{{
							new Date(comment.publishedAt).toLocaleDateString(
								"ru-RU",
								{
									day: "2-digit",
									month: "2-digit",
									year: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								},
							)
						}}
					</span>
				</div>

				<div v-if="comments.length === 0" :class="$style.noComments">
					Комментариев пока нет
				</div>

				<div :class="$style.addComment">
					<UiTextarea
						v-model="commentBody"
						:rows="3"
						placeholder="Написать комментарий..."
						:class="$style.commentInput"
					/>
					<UiButton
						accent
						:disabled="submittingComment || !commentBody.trim()"
						@click="addComment"
					>
						{{ submittingComment ? "Отправка..." : "Отправить" }}
					</UiButton>
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

	.ownerTools {
		display: flex;
		flex-direction: column;
		row-gap: 10px;

		.delete {
			@include color-error-bg;
		}

		.edit {
			@include color-black-bg(0.08);
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
		row-gap: 20px;

		.owner {
			width: fit-content;
			margin-left: auto;
			display: flex;
			align-items: center;
			column-gap: 20px;

			.avatar {
				width: 50px;
				height: 50px;
				border-radius: 100%;
			}

			.ownerName {
				@include title-m;
				@include color-black;
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

		.price {
			@include reset;
			@include title-m;
			@include color-black;

			margin-left: auto;
		}
	}

	.commentsSection {
		display: flex;
		flex-direction: column;
		row-gap: 15px;

		.commentsTitle {
			@include reset;
			@include title-m;
			@include color-black;
		}

		.comment {
			display: flex;
			flex-direction: column;
			row-gap: 8px;
			padding: 15px;
			border-radius: 10px;

			@include color-black-bg(0.04);

			.commentAuthor {
				display: flex;
				align-items: center;
				column-gap: 10px;
				width: fit-content;

				.commentAvatar {
					width: 36px;
					height: 36px;
					border-radius: 100%;
				}

				.commentAuthorName {
					@include title-s;
					@include color-black;

					font-weight: 600;
				}
			}

			.commentBody {
				@include reset;
				@include text-m;
				@include color-black;
			}

			.commentDate {
				@include text-s;
				@include color-black;

				opacity: 0.4;
				margin-left: auto;
			}
		}

		.noComments {
			@include text-m;
			@include color-black;

			opacity: 0.5;
			text-align: center;
			padding: 20px 0;
		}

		.addComment {
			display: flex;
			flex-direction: column;
			row-gap: 10px;
		}
	}
}
</style>
