<script setup lang="ts">
definePageMeta({ middleware: "authenticated" });

import type { Abstract } from "~/entities/Abstract";
import type { AbstractDtoById } from "~~/server/dto/abstract/byId";
import type { byId } from "~~/server/dto/profile/byId";
import { useAuthStore } from "~/stores/authStore";
import { useSelfStore } from "~/stores/selfStore";
import { useDevice } from "~/composables/device";
import PhotoViewerComponent from "~/components/teleports/PhotoViewerComponent.vue";

const route = useRoute();
const router = useRouter();
const { deviceClassList } = useDevice();
const headers = useRequestHeaders(["cookie"]);

const auth = useAuthStore();
const { self } = useSelfStore();
const isAdmin = auth.isAdmin;

const id = route.params.id as string;

const { data: original, error: initError } = await useAsyncData<AbstractDtoById>(
	"abstract-" + id,
	() => $fetch<AbstractDtoById>("/api/abstract/byId?id=" + id, { headers }),
);

if (!original.value) {
	const e = initError.value as { statusCode?: number; data?: { message?: string } } | null;
	throw createError({
		statusCode: e?.statusCode ?? 404,
		message: e?.data?.message ?? "Конспект не найден",
	});
}

const item = ref<Abstract>({
	id: original.value.id,
	type: original.value.type,
	title: original.value.title,
	subject: original.value.subject,
	description: original.value.description,
	imageIds: original.value.imageIds,
	authorId: original.value.authorId,
	likes: [],
	likeCount: original.value.likeCount,
	userLiked: original.value.userLiked,
	createdAt: original.value.createdAt,
	updatedAt: original.value.updatedAt,
});

try {
	const profile = await $fetch<byId>(
		"/api/profile/byId?id=" + item.value.authorId,
		{ headers },
	);
	item.value.author = unwrapProfile(profile);
} catch {}

useSeoMeta({
	title: () => item.value.title || "Конспект",
	description: () => item.value.description || "Конспект в Hostelite",
	robots: "noindex, nofollow",
});

const isAuthor = computed(() => item.value.authorId === self?.id);
const canEdit = computed(() => isAuthor.value || isAdmin);

const bookmarks = useBookmarks("abstract");
const isBookmarked = computed(() => bookmarks.isBookmarked(id));
const bookmarkLimitReached = ref(false);
const toggleBookmark = () => {
	bookmarkLimitReached.value = false;
	const ok = bookmarks.toggle(id);
	if (!ok) bookmarkLimitReached.value = true;
};

const toggleLike = async (): Promise<void> => {
	try {
		const res = await $fetch<{
			id: string;
			likeCount: number;
			userLiked: boolean;
		}>("/api/abstract/like?id=" + id, { method: "PUT" });
		item.value.likeCount = res.likeCount;
		item.value.userLiked = res.userLiked;
	} catch {}
};

const handleDelete = async () => {
	if (!confirm("Удалить конспект?")) return;
	await $fetch("/api/abstract/delete?id=" + id, { method: "DELETE" });
	router.push("/abstracts");
};

const viewerOpen = ref(false);
const viewerSrc = ref("");
const openViewer = (guid: string) => {
	viewerSrc.value = `/api/images/byGuid?guid=${guid}`;
	viewerOpen.value = true;
};

const typeLabel = computed(() =>
	item.value.type === "lab" ? "Лабораторная" : "Лекция",
);

const formatDate = (iso: string) => {
	const d = new Date(iso);
	return d.toLocaleDateString("ru-RU", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<div :class="$style.head">
				<div :class="$style.headLeft">
					<span :class="$style.typeBadge">{{ typeLabel }}</span>
					<span :class="$style.subject">{{ item.subject }}</span>
				</div>
				<UiButton
					unset
					:class="[$style.bookmarkBtn, isBookmarked && $style.bookmarkedActive]"
					@click="toggleBookmark"
					:title="
						isBookmarked
							? 'Убрать из закладок'
							: `В закладки (${bookmarks.ids.value.length}/${bookmarks.max})`
					"
				>
					<Icon
						:name="
							isBookmarked
								? 'mdi:bookmark'
								: 'mdi:bookmark-outline'
						"
						:class="$style.bookmarkIcon"
					/>
				</UiButton>
			</div>

			<p v-if="bookmarkLimitReached" :class="$style.warn">
				Достигнут лимит закладок ({{ bookmarks.max }}).
			</p>

			<h1 :class="$style.title">{{ item.title }}</h1>

			<div
				v-if="item.imageIds && item.imageIds.length"
				:class="$style.galleryWrap"
			>
				<UiGallery
					:class="$style.gallery"
					:slides-per-view="1"
					:autoplay="3500"
					loop
				>
					<template
						v-for="(guid, index) in item.imageIds"
						:key="index"
						v-slot:[index]
					>
						<img
							:class="$style.image"
							:src="`/api/images/byGuid?guid=${guid}`"
							@click="openViewer(String(guid))"
						/>
					</template>
				</UiGallery>
			</div>

			<div v-if="item.description" :class="$style.descBlock">
				<h3 :class="$style.subtitle">Описание</h3>
				<p :class="$style.description">{{ item.description }}</p>
			</div>

			<div :class="$style.meta">
				<RouterLink
					v-if="item.author"
					:to="`/profile/${item.author.id}`"
					:class="$style.author"
				>
					<Icon
						name="mdi:account-outline"
						:class="$style.metaIcon"
					/>
					{{ item.author.name }} {{ item.author.surname }}
				</RouterLink>
				<span :class="$style.metaItem">
					<Icon
						name="mdi:calendar-outline"
						:class="$style.metaIcon"
					/>
					{{ formatDate(item.createdAt) }}
				</span>
			</div>

			<div :class="$style.actions">
				<UiButton
					:class="[$style.likeBtn, item.userLiked && $style.likeBtnActive]"
					@click="toggleLike"
				>
					<Icon
						:name="
							item.userLiked
								? 'mdi:heart'
								: 'mdi:heart-outline'
						"
						:class="$style.likeIcon"
					/>
					{{ item.likeCount }}
				</UiButton>
				<RouterLink v-if="canEdit" :to="'/abstracts/edit/' + id">
					<UiButton inset>Редактировать</UiButton>
				</RouterLink>
				<UiButton
					v-if="canEdit"
					:class="$style.delete"
					@click="handleDelete"
				>
					Удалить
				</UiButton>
			</div>
		</div>

		<PhotoViewerComponent v-model:is-opened="viewerOpen" :src="viewerSrc" />
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;

		display: flex;
		flex-direction: column;
		row-gap: 20px;

		@include respond-to(mobile) {
			@include container(mobile);

			row-gap: 16px;
		}
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		column-gap: 12px;
	}

	.headLeft {
		display: flex;
		align-items: center;
		column-gap: 10px;
	}

	.typeBadge {
		@include text-s;
		@include color-warn-bg;

		padding: 4px 10px;
		border-radius: 100px;
		font-weight: 500;
	}

	.subject {
		@include text-m;
		@include color-accent;

		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.bookmarkBtn {
		padding: 6px;
		opacity: 0.55;
		transition: opacity $transition-fast;

		&:hover,
		&.bookmarkedActive {
			opacity: 1;
		}

		&.bookmarkedActive {
			@include color-accent;
		}
	}

	.bookmarkIcon {
		width: 24px;
		height: 24px;
	}

	.warn {
		@include text-s;
		@include color-warn-bg;

		padding: 8px 12px;
		border-radius: 8px;
		margin: 0;
	}

	.title {
		@include reset;
		@include title-l;
		@include color-black;
	}

	.galleryWrap {
		.gallery {
			height: 420px;
			width: 100%;
			border-radius: 12px;
			overflow: hidden;

			@include respond-to(mobile) {
				height: 260px;
			}

			.image {
				width: 100%;
				height: 100%;
				object-fit: cover;
				cursor: zoom-in;
				pointer-events: auto;
			}
		}
	}

	.descBlock {
		display: flex;
		flex-direction: column;
		row-gap: 6px;

		.subtitle {
			@include reset;
			@include text-m;
			@include color-black;

			opacity: 0.6;
		}

		.description {
			@include reset;
			@include text-m;
			@include color-black;

			white-space: pre-wrap;
		}
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		column-gap: 16px;
		row-gap: 4px;
	}

	.author,
	.metaItem {
		@include text-s;
		@include color-black;

		display: flex;
		align-items: center;
		column-gap: 4px;
		opacity: 0.7;
		text-decoration: none;
	}

	.metaIcon {
		width: 14px;
		height: 14px;
	}

	.actions {
		display: flex;
		column-gap: 10px;
		flex-wrap: wrap;
	}

	.likeBtn {
		display: flex;
		align-items: center;
		column-gap: 6px;

		&.likeBtnActive {
			@include color-accent-bg;
			color: #fff;
		}
	}

	.likeIcon {
		width: 18px;
		height: 18px;
	}

	.delete {
		@include color-error-bg;
	}
}
</style>
