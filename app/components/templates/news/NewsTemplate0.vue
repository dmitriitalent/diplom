<script setup lang="ts">
import type { Cached } from "~/stores/cacheStore";
import type { News } from "~/entities/News";
import { useDevice } from "~/composables/device";

const props = defineProps<{
	news: Cached<News>;
	isAdmin: boolean;
	isAuthor: boolean;
	moderateForm: { comment: string; status: string };
	moderationStatus: string;
}>();

const emit = defineEmits<{
	(e: "delete"): void;
	(e: "edit"): void;
	(e: "moderate", status: string): void;
}>();

const { deviceClassList } = useDevice();
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container" v-if="news.title">
			<div v-if="isAuthor && !isAdmin" :class="$style.authorTools">
				<UiButton :class="$style.edit" @click="emit('edit')"
					>Редактировать</UiButton
				>
			</div>

			<div v-if="isAdmin" :class="$style.adminTools">
				<UiButton :class="$style.delete" @click="emit('delete')"
					>Удалить</UiButton
				>
				<UiButton :class="$style.edit" @click="emit('edit')"
					>Редактировать</UiButton
				>
				<UiButton
					v-if="moderationStatus === 'pending'"
					:class="$style.approve"
					@click="emit('moderate', 'approved')"
					>Одобрить</UiButton
				>
				<UiButton
					v-if="moderationStatus === 'pending'"
					:class="$style.decline"
					@click="emit('moderate', 'declined')"
					>Отклонить</UiButton
				>
				<UiButton
					v-if="moderationStatus === 'pending'"
					:class="$style.block"
					@click="emit('moderate', 'blocked')"
					>Заблокировать пользователя</UiButton
				>
				<UiTextarea
					v-if="news.moderationStatus === 'pending'"
					v-model="props.moderateForm.comment"
					:rows="2"
					placeholder="Комментарий принятого решения"
				/>
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
				<RouterLink
					v-if="news.author"
					:to="`/profile/${news.author.id}`"
				>
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
	}
}
</style>
