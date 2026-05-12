<script setup lang="ts">
import type { News } from "~/entities/News";
import { useAuthStore } from "~/stores/authStore";
import { useCategoryStore } from "~/stores/categoryStore";
import { useSelfStore } from "~/stores/selfStore";
import type { NewsDtoById } from "~~/server/dto/news/byId";
import type { NewsListDtoList } from "~~/server/dto/news/newsList";
import type { byId } from "~~/server/dto/profile/byId";
import { jwtDecode } from "jwt-decode";
import { useDevice } from "~/composables/device";

const route = useRoute();
const router = useRouter();
const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;

const { at } = useAuthStore();
const { self } = useSelfStore();
const isAdmin = jwtDecode(at as string).roles.includes("ADMIN");
const { deviceClassList } = useDevice();

const { data: news, error } = await useAsyncData<News>(
	"news-full",
	async () => {
		const newsFetch = await $fetch<NewsDtoById>(
			"/api/news/byId?id=" + route.params.id,
		);

		const authorFetch = await $fetch<byId>(
			"/api/profile/byId?id=" + newsFetch.authorId,
			{
				headers,
				credentials: "include",
			},
		);

		const author = unwrapProfile(authorFetch);

		return {
			content: newsFetch.content,
			id: newsFetch.id,
			imageIds: newsFetch.imageIds,
			title: newsFetch.title,
			author: author,
			activityIds: newsFetch.activityIds,
			createdAt: newsFetch.createdAt,
			dormitoryId: newsFetch.dormitoryId,
			moderationComment: newsFetch.moderationComment,
			moderationStatus: newsFetch.moderationStatus,
			productIds: newsFetch.productIds,
			reactionCount: newsFetch.reactionCount,
			updatedAt: newsFetch.updatedAt,
			userReaction: newsFetch.userReaction,
			viewTemplate: newsFetch.viewTemplate,
		} as News;
	},
);

const newsVisual = ref(JSON.parse(JSON.stringify(news.value)));

const isAuthor = news.value?.author.id === self?.id;
const canEdit = isAdmin || isAuthor;

const deleteNews = () => {
	$fetch("/api/news/delete?id=" + news.value?.id, {
		method: "DELETE",
	}).then((res) => {
		useRouter().push("/news");
	});
};

const moderateForm = ref({
	comment: "",
	status: "",
});

const moderateNews = (status: string) => {
	moderateForm.value.status = status;
	$fetch("/api/news/moderate?id=" + news.value?.id, {
		body: moderateForm.value,
		method: "PUT",
		credentials: "include",
	}).then((res) => {
		newsVisual.value.moderationStatus = status;
	});
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container" v-if="news">
			<div v-if="canEdit" :class="$style.authorTools">
				<UiButton
					v-if="!isAdmin"
					:class="$style.edit"
					@click="router.push('/news/edit/' + news.id)"
					>Редактировать</UiButton
				>
			</div>

			<div v-if="isAdmin" :class="$style.adminTools">
				<UiButton :class="$style.delete" @click="deleteNews"
					>Удалить</UiButton
				>
				<UiButton
					:class="$style.edit"
					@click="router.push('/news/edit/' + news.id)"
					>Редактировать</UiButton
				>

				<UiButton
					v-if="newsVisual.moderationStatus === 'pending'"
					:class="$style.approve"
					@click="moderateNews('approved')"
					>Одобрить</UiButton
				>
				<UiButton
					v-if="newsVisual.moderationStatus === 'pending'"
					:class="$style.decline"
					@click="moderateNews('declined')"
					>Отклонить</UiButton
				>
				<UiButton
					v-if="newsVisual.moderationStatus === 'pending'"
					:class="$style.block"
					@click="moderateNews('blocked')"
					>Заблокировать пользователя</UiButton
				>

				<UiTextarea
					v-if="news.moderationStatus === 'pending'"
					v-model="moderateForm.comment"
					:rows="2"
					placeholder="Комментарий принятого решения по отклонению/одобрению/блокированию"
				></UiTextarea>
			</div>

			<div :class="$style.top">
				<UiGallery :class="$style.gallery" :autoplay="3000" loop>
					<template
						v-for="(image, index) in news.imageIds"
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
				<RouterLink :to="`/profile/${news.author.id}`">
					<div :class="$style.author">
						<img
							:src="`/api/images/byGuid?guid=avatar`"
							:class="$style.image"
						/>
						<div :class="$style.name">
							{{ news.author.name + " " + news.author.surname }}
						</div>
					</div>
				</RouterLink>
				<h3 :class="$style.name">{{ news.title }}</h3>
				<p :class="$style.description">{{ news.content }}</p>
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

	.authorTools {
		display: flex;
		flex-direction: column;
		row-gap: 10px;

		.edit {
			@include color-black-bg(0.08);
		}
	}

	.adminTools {
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

		.price {
			@include reset;
			@include text-l;
			@include color-black;

			margin-left: auto;
		}
	}
}
</style>
