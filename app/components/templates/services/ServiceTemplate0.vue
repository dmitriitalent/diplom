<script setup lang="ts">
import type { Cached } from "~/stores/cacheStore";
import type { Service, ServiceComment } from "~/entities/Service";
import { useDevice } from "~/composables/device";
import { useSelfStore } from "~/stores/selfStore";

const props = defineProps<{
	service: Cached<Service>;
	isAdmin: boolean;
	isOwner: boolean;
}>();

const emit = defineEmits<{
	(e: "delete"): void;
	(e: "edit"): void;
	(e: "add-comment", body: string): void;
}>();

const { deviceClassList } = useDevice();
const { self } = useSelfStore();

const comments = computed<ServiceComment[]>(() => props.service.comments ?? []);

const commentBody = ref("");
const submittingComment = ref(false);

const submitComment = async () => {
	if (!commentBody.value.trim() || submittingComment.value) return;
	submittingComment.value = true;
	try {
		emit("add-comment", commentBody.value);
		commentBody.value = "";
	} finally {
		submittingComment.value = false;
	}
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container" v-if="service.name">
			<div v-if="isAdmin || isOwner" :class="$style.ownerTools">
				<UiButton :class="$style.delete" @click="emit('delete')"
					>Удалить</UiButton
				>
				<UiButton :class="$style.edit" @click="emit('edit')"
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
				<RouterLink
					v-if="service.owner"
					:to="`/profile/${service.owner.id}`"
				>
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
							{{ comment.author?.name }} {{ comment.author?.surname }}
						</span>
					</RouterLink>
					<p :class="$style.commentBody">{{ comment.body }}</p>
					<span :class="$style.commentDate">
						{{
							new Date(comment.publishedAt).toLocaleDateString("ru-RU", {
								day: "2-digit",
								month: "2-digit",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})
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
						@click="submitComment"
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

		@include respond-to(mobile) {
			@include container(mobile);

			row-gap: 20px;
		}
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
		row-gap: 20px;

		.owner {
			width: fit-content;
			margin-left: auto;
			display: flex;
			align-items: center;
			column-gap: 20px;

			@include respond-to(mobile) {
				margin-left: 0;
			}

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

		.price {
			@include reset;
			@include title-m;
			@include color-black;

			margin-left: auto;

			@include respond-to(mobile) {
				margin-left: 0;
			}
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
