<script setup lang="ts">
import { storeToRefs } from "pinia";
import PhotoViewerComponent from "~/components/teleports/PhotoViewerComponent.vue";
import { useDevice } from "~/composables/device";
import { useSelfStore } from "~/stores/selfStore";
import type { byId } from "~~/server/dto/profile/byId";
import type { ProductDtoGetList } from "~~/server/dto/product/list";
import type { ServiceDtoList } from "~~/server/dto/service/list";
import type { ActivityDtoList } from "~~/server/dto/activity/list";
import type { Post, PostListDto } from "~~/server/dto/post/post";

const selfStore = useSelfStore();
const { self } = storeToRefs(selfStore);
const { updateAvatar, deleteAvatar } = selfStore;
const { deviceClassList, isDevice } = useDevice();

const route = useRoute();
const router = useRouter();
const reqHeaders = useRequestHeaders(["cookie"]);

const userId = computed(() => String(route.params.id));
const isSelf = computed(() => self.value?.id === userId.value);

// ─── Profile data ─────────────────────────────────────────────────────────────

const { data: userData, refresh: refreshUser } = await useAsyncData(
	() => `profile-${userId.value}`,
	() =>
		$fetch<byId>("/api/profile/byId?id=" + userId.value, {
			headers: reqHeaders,
		}),
	{ watch: [userId] },
);

// ─── Friend status (только для чужих) ─────────────────────────────────────────

const { data: friendIds, refresh: refreshFriendIds } = await useAsyncData(
	"my-friend-list",
	async () => {
		try {
			const res = await $fetch<{ friends: string[] }>(
				"/api/friend/list",
				{
					headers: reqHeaders,
				},
			);
			return res.friends ?? [];
		} catch {
			return [];
		}
	},
);

const { data: pendingOut, refresh: refreshPendingOut } = await useAsyncData(
	"my-friend-pending-out",
	async () => {
		try {
			const res = await $fetch<{ pending_out: string[] }>(
				"/api/friend/pendingOut",
				{ headers: reqHeaders },
			);
			return res.pending_out ?? [];
		} catch {
			return [];
		}
	},
);

const isFriend = computed(
	() => friendIds.value?.includes(userId.value) ?? false,
);
const isPending = computed(
	() => pendingOut.value?.includes(userId.value) ?? false,
);

const friendLoading = ref(false);
const onAddFriend = async () => {
	friendLoading.value = true;
	try {
		await $fetch(`/api/friend/request?friendId=${userId.value}`, {
			method: "POST",
		});
		await refreshPendingOut();
	} finally {
		friendLoading.value = false;
	}
};
const onRemoveFriend = async () => {
	friendLoading.value = true;
	try {
		await $fetch(`/api/friend/delete?friendId=${userId.value}`, {
			method: "DELETE",
		});
		await refreshFriendIds();
	} finally {
		friendLoading.value = false;
	}
};

const writeContact = () => {
	const url = getPrimaryContactUrl(userData.value?.contacts ?? []);
	if (url) window.open(url, "_blank");
};

// ─── User content: products / services / activities ───────────────────────────

const { data: products } = await useAsyncData(
	() => `profile-products-${userId.value}`,
	() =>
		$fetch<ProductDtoGetList>(
			`/api/product/list?owner_id=${userId.value}&limit=20`,
			{ headers: reqHeaders },
		).catch(() => ({ products: [] })),
	{ watch: [userId] },
);

const { data: services } = await useAsyncData(
	() => `profile-services-${userId.value}`,
	() =>
		$fetch<ServiceDtoList>(
			`/api/service/list?owner_id=${userId.value}&limit=20`,
			{ headers: reqHeaders },
		).catch(() => ({ services: [] })),
	{ watch: [userId] },
);

const { data: activities } = await useAsyncData(
	() => `profile-activities-${userId.value}`,
	() =>
		$fetch<ActivityDtoList>(
			`/api/profile/activities?userId=${userId.value}&limit=20`,
			{ headers: reqHeaders },
		).catch(() => ({ activities: [] })),
	{ watch: [userId] },
);

// ─── Posts (стена) ────────────────────────────────────────────────────────────

const { data: postsData, refresh: refreshPosts } = await useAsyncData(
	() => `profile-posts-${userId.value}`,
	() =>
		$fetch<PostListDto>(`/api/profile/posts?userId=${userId.value}`, {
			headers: reqHeaders,
		}).catch(() => ({ posts: [] as Post[] })),
	{ watch: [userId] },
);

const posts = computed<Post[]>(() => {
	const list = postsData.value?.posts ?? [];
	// сортировка по дате создания, новые сверху
	return [...list].sort((a, b) => {
		const ta = new Date(a.createdAt).getTime();
		const tb = new Date(b.createdAt).getTime();
		return tb - ta;
	});
});

const composerText = ref("");
const composerSubmitting = ref(false);
const composerError = ref("");

const POST_MAX_LENGTH = 2000;

const onPublishPost = async () => {
	const content = composerText.value.trim();
	if (!content || composerSubmitting.value) return;

	composerSubmitting.value = true;
	composerError.value = "";
	try {
		await $fetch("/api/post/create", {
			method: "POST",
			body: { content, imageIds: [], visibility: "EVERYONE" },
		});
		composerText.value = "";
		await refreshPosts();
	} catch (err: any) {
		composerError.value =
			err?.data?.message ?? err?.message ?? "Не удалось опубликовать";
	} finally {
		composerSubmitting.value = false;
	}
};

// ─── Post editing ──────────────────────────────────────────────────────────

const editingPostId = ref<string | null>(null);
const editingText = ref("");
const editingSubmitting = ref(false);

const startEditPost = (post: Post) => {
	editingPostId.value = post.id;
	editingText.value = post.content;
};

const cancelEditPost = () => {
	editingPostId.value = null;
	editingText.value = "";
};

const saveEditPost = async (post: Post) => {
	const content = editingText.value.trim();
	if (!content || editingSubmitting.value) return;

	editingSubmitting.value = true;
	try {
		await $fetch(`/api/post/edit?id=${post.id}`, {
			method: "PUT",
			body: {
				content,
				imageIds: post.imageIds ?? [],
				visibility: post.visibility ?? "EVERYONE",
			},
		});
		editingPostId.value = null;
		editingText.value = "";
		await refreshPosts();
	} catch (err) {
		console.error("post edit failed", err);
	} finally {
		editingSubmitting.value = false;
	}
};

const deletePost = async (post: Post) => {
	if (!confirm("Удалить пост?")) return;
	try {
		await $fetch(`/api/post/delete?id=${post.id}`, {
			method: "DELETE",
		});
		await refreshPosts();
	} catch (err) {
		console.error("post delete failed", err);
	}
};

const canEditPost = (post: Post) =>
	isSelf.value && post.userId === self.value?.id;

// ─── Карусели: количество слайдов в зависимости от размера экрана ─────────────

const eventSlides = computed(() => (isDevice("mobile") ? 1.2 : 3));
const productSlides = computed(() => (isDevice("mobile") ? 1.4 : 4));
const serviceSlides = computed(() => (isDevice("mobile") ? 1.2 : 3));

const formatPostDate = (iso?: string) => {
	if (!iso) return "";
	try {
		const d = new Date(iso);
		const now = Date.now();
		const diffMin = Math.floor((now - d.getTime()) / 60000);
		if (diffMin < 1) return "только что";
		if (diffMin < 60) return `${diffMin} мин назад`;
		const diffH = Math.floor(diffMin / 60);
		if (diffH < 24) return `${diffH} ч назад`;
		return d.toLocaleString("ru-RU", {
			day: "2-digit",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
};

// ─── Avatar viewer ────────────────────────────────────────────────────────────

const viewerOpen = ref(false);
const uploadingAvatar = ref(false);
const avatarCacheBust = ref(0);

const avatarGuid = computed(() => userData.value?.avatarId);
const avatarSrc = computed(() => {
	const guid = avatarGuid.value;
	if (!guid) return "";
	return `/api/images/byGuid?guid=${guid}&v=${avatarCacheBust.value}`;
});

const onAvatarClick = () => {
	viewerOpen.value = true;
};

const onReplaceAvatar = async (file: File) => {
	uploadingAvatar.value = true;
	try {
		const guid = crypto.randomUUID();
		const formData = new FormData();
		formData.append("file", file);
		formData.append("external_id", guid);
		await $fetch("/api/images/upload", {
			method: "POST",
			body: formData,
		});
		await updateAvatar(guid);
		avatarCacheBust.value++;
		await refreshUser();
	} catch (err) {
		console.error("avatar upload failed", err);
	} finally {
		uploadingAvatar.value = false;
	}
};

const onDeleteAvatar = async () => {
	uploadingAvatar.value = true;
	try {
		await deleteAvatar();
		avatarCacheBust.value++;
		await refreshUser();
		viewerOpen.value = false;
	} catch (err) {
		console.error("avatar delete failed", err);
	} finally {
		uploadingAvatar.value = false;
	}
};

// ─── Helpers for display ──────────────────────────────────────────────────────

const ownerName = computed(() => {
	const u = userData.value;
	if (!u) return "";
	return [unwrapField(u.name), unwrapField(u.surname)]
		.filter(Boolean)
		.join(" ");
});

const locationLine = computed(() => {
	const u = userData.value;
	if (!u) return "";
	const building = unwrapField(u.building);
	const floor = unwrapField(u.floor);
	const room = unwrapField(u.room);
	const parts: string[] = [];
	if (building) parts.push("корп. " + building);
	if (floor) parts.push(floor + " эт.");
	if (room) parts.push("комн. " + room);
	return parts.join(" · ");
});

const friendsCount = computed(() => userData.value?.friends?.length ?? 0);

const formatActivityWhen = (iso?: string) => {
	if (!iso) return "";
	try {
		const d = new Date(iso);
		return d.toLocaleString("ru-RU", {
			day: "2-digit",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.inner">
			<!-- ── HEADER: cover + avatar + buttons ──────────────────── -->
			<div :class="$style.header">
				<div :class="$style.cover"></div>

				<UiImage
					:class="$style.avatar"
					:src="avatarSrc"
					style="cursor: pointer"
					@click="onAvatarClick"
				></UiImage>

				<!-- Кнопки-ромбы (вертикальная колонка) -->
				<div :class="$style.actionColumn">
					<template v-if="isSelf">
						<RouterLink to="/profile/self/friends">
							<UiButton :class="$style.diamondBtn" size="custom">
								<Icon
									name="fa7-solid:user-friends"
									:class="$style.diamondIcon"
								/>
							</UiButton>
						</RouterLink>
						<RouterLink to="/chats">
							<UiButton :class="$style.diamondBtn" size="custom">
								<Icon
									name="material-symbols:android-messages"
									:class="$style.diamondIcon"
								/>
							</UiButton>
						</RouterLink>
						<RouterLink to="/bookmarks">
							<UiButton :class="$style.diamondBtn" size="custom">
								<Icon
									name="material-symbols:bookmark"
									:class="$style.diamondIcon"
								/>
							</UiButton>
						</RouterLink>
						<RouterLink to="/profile/self/settings">
							<UiButton :class="$style.diamondBtn" size="custom">
								<Icon
									name="material-symbols:settings"
									:class="$style.diamondIcon"
								/>
							</UiButton>
						</RouterLink>
					</template>
					<template v-else>
						<UiButton
							v-if="isFriend"
							:class="$style.diamondBtn"
							size="custom"
							:disabled="
								!getPrimaryContactUrl(userData?.contacts ?? [])
							"
							@click="writeContact"
						>
							<Icon
								name="material-symbols:android-messages"
								:class="$style.diamondIcon"
							/>
						</UiButton>
						<UiButton
							v-if="isFriend"
							:class="$style.diamondBtn"
							size="custom"
							:disabled="friendLoading"
							@click="onRemoveFriend"
						>
							<Icon
								name="mdi:account-remove"
								:class="$style.diamondIcon"
							/>
						</UiButton>
						<UiButton
							v-else
							:class="$style.diamondBtn"
							size="custom"
							:disabled="friendLoading || isPending"
							@click="onAddFriend"
						>
							<Icon
								:name="
									isPending
										? 'mdi:account-clock'
										: 'mdi:account-plus'
								"
								:class="$style.diamondIcon"
							/>
						</UiButton>
					</template>
				</div>
			</div>

			<!-- ── Name & meta ───────────────────────────────────────── -->
			<div :class="$style.profileMeta">
				<h1 :class="$style.name">{{ ownerName || "—" }}</h1>
				<div :class="$style.metaRow">
					<span v-if="locationLine" :class="$style.metaItem">
						<Icon
							name="mdi:home-outline"
							:class="$style.metaIcon"
						/>
						{{ locationLine }}
					</span>
					<span :class="$style.metaItem">
						<Icon
							name="mdi:account-multiple-outline"
							:class="$style.metaIcon"
						/>
						{{ friendsCount }} друзей
					</span>
				</div>
			</div>

			<!-- ── Activities carousel ───────────────────────────────── -->
			<section
				v-if="activities?.activities?.length"
				:class="$style.section"
			>
				<div :class="$style.sectionHead">
					<div :class="$style.sectionTitleWrap">
						<h3 :class="$style.sectionTitle">Мероприятия</h3>
						<span :class="$style.sectionCount">
							{{ activities.activities.length }}
						</span>
					</div>
					<RouterLink to="/activities" :class="$style.sectionLink">
						смотреть всё
					</RouterLink>
				</div>
				<UiGallery
					:slides-per-view="eventSlides"
					:space-between="14"
					:class="$style.gallery"
				>
					<template
						v-for="(a, i) in activities.activities"
						:key="a.id"
						v-slot:[i]
					>
						<RouterLink
							:to="`/activities/${a.id}`"
							:class="$style.gallerySlide"
						>
							<ActivityCardComponent :activity="a" />
						</RouterLink>
					</template>
				</UiGallery>
			</section>

			<!-- ── Products carousel ─────────────────────────────────── -->
			<section v-if="products?.products?.length" :class="$style.section">
				<div :class="$style.sectionHead">
					<div :class="$style.sectionTitleWrap">
						<h3 :class="$style.sectionTitle">Товары в каталоге</h3>
						<span :class="$style.sectionCount">
							{{ products.products.length }}
						</span>
					</div>
					<RouterLink to="/catalog" :class="$style.sectionLink">
						смотреть всё
					</RouterLink>
				</div>
				<UiGallery
					:slides-per-view="productSlides"
					:space-between="14"
					:class="$style.gallery"
				>
					<template
						v-for="(p, i) in products.products"
						:key="p.id"
						v-slot:[i]
					>
						<RouterLink
							:to="`/catalog/${p.id}`"
							:class="$style.gallerySlide"
						>
							<ProductCardComponent :product="p" />
						</RouterLink>
					</template>
				</UiGallery>
			</section>

			<!-- ── Services carousel ─────────────────────────────────── -->
			<section v-if="services?.services?.length" :class="$style.section">
				<div :class="$style.sectionHead">
					<div :class="$style.sectionTitleWrap">
						<h3 :class="$style.sectionTitle">Услуги</h3>
						<span :class="$style.sectionCount">
							{{ services.services.length }}
						</span>
					</div>
					<RouterLink to="/services" :class="$style.sectionLink">
						смотреть всё
					</RouterLink>
				</div>
				<UiGallery
					:slides-per-view="serviceSlides"
					:space-between="14"
					:class="$style.gallery"
				>
					<template
						v-for="(s, i) in services.services"
						:key="(s as any).id"
						v-slot:[i]
					>
						<RouterLink
							:to="`/services/${(s as any).id}`"
							:class="$style.gallerySlide"
						>
							<ServiceCardComponent :service="s as any" />
						</RouterLink>
					</template>
				</UiGallery>
			</section>

			<!-- ── Empty state, если совсем ничего нет ──────────────── -->
			<div
				v-if="
					!activities?.activities?.length &&
					!products?.products?.length &&
					!services?.services?.length
				"
				:class="$style.emptyState"
			>
				{{
					isSelf
						? "Вы пока ничего не опубликовали"
						: "Пользователь пока ничего не опубликовал"
				}}
			</div>

			<!-- ── Wall ──────────────────────────────────────────────── -->
			<section :class="$style.section">
				<h3 :class="$style.sectionTitle">Стена</h3>

				<div v-if="isSelf" :class="$style.composer">
					<UiTextarea
						v-model="composerText"
						:rows="3"
						placeholder="О чём вы думаете? Только текст — без вложений."
						:maxlength="POST_MAX_LENGTH"
					/>
					<div v-if="composerError" :class="$style.composerError">
						{{ composerError }}
					</div>
					<div :class="$style.composerFoot">
						<span :class="$style.composerCounter">
							{{ composerText.length }}/{{ POST_MAX_LENGTH }}
						</span>
						<UiButton
							accent
							:class="$style.composerSubmit"
							:disabled="
								!composerText.trim() || composerSubmitting
							"
							@click="onPublishPost"
						>
							{{
								composerSubmitting
									? "Публикация..."
									: "Опубликовать"
							}}
						</UiButton>
					</div>
				</div>

				<div v-if="!posts.length" :class="$style.wallEmpty">
					{{ isSelf ? "У вас пока нет постов" : "Постов пока нет" }}
				</div>

				<div v-else :class="$style.postsList">
					<article
						v-for="p in posts"
						:key="p.id"
						:class="$style.post"
					>
						<div :class="$style.postHeader">
							<span :class="$style.postAuthor">
								{{
									isSelf && p.userId === self?.id
										? "Вы"
										: ownerName
								}}
							</span>
							<span :class="$style.postDot">·</span>
							<span :class="$style.postDate">
								{{ formatPostDate(p.createdAt) }}
							</span>
							<span
								v-if="
									p.updatedAt && p.updatedAt !== p.createdAt
								"
								:class="$style.postEdited"
							>
								(изменено)
							</span>

							<div
								v-if="canEditPost(p)"
								:class="$style.postActions"
							>
								<button
									v-if="editingPostId !== p.id"
									:class="$style.postIconBtn"
									title="Изменить"
									@click="startEditPost(p)"
								>
									<Icon
										name="mdi:pencil-outline"
										:class="$style.postActionIcon"
									/>
								</button>
								<button
									:class="$style.postIconBtn"
									title="Удалить"
									@click="deletePost(p)"
								>
									<Icon
										name="mdi:delete-outline"
										:class="$style.postActionIcon"
									/>
								</button>
							</div>
						</div>

						<template v-if="editingPostId === p.id">
							<UiTextarea
								v-model="editingText"
								:rows="3"
								:maxlength="POST_MAX_LENGTH"
							/>
							<div :class="$style.postEditActions">
								<UiButton
									:class="$style.postCancel"
									@click="cancelEditPost"
								>
									Отмена
								</UiButton>
								<UiButton
									accent
									:disabled="
										!editingText.trim() || editingSubmitting
									"
									@click="saveEditPost(p)"
								>
									{{
										editingSubmitting
											? "Сохранение..."
											: "Сохранить"
									}}
								</UiButton>
							</div>
						</template>
						<p v-else :class="$style.postContent">
							{{ p.content }}
						</p>
					</article>
				</div>
			</section>
		</div>

		<PhotoViewerComponent
			v-model:is-opened="viewerOpen"
			:src="avatarSrc"
			:can-edit="isSelf"
			:can-delete="isSelf"
			:uploading="uploadingAvatar"
			@replace="onReplaceAvatar"
			@delete="onDeleteAvatar"
		/>
	</div>
</template>

<style module lang="scss">
.wrapper {
	width: 100%;
	padding-bottom: 80px;

	.inner {
		@include container;

		display: flex;
		flex-direction: column;
		row-gap: 40px;
		padding-top: 30px;

		@include respond-to(mobile) {
			@include container(mobile);

			row-gap: 24px;
			padding-top: 16px;
		}
	}
}

// ── Header ─────────────────────────────────────────────────────────

.header {
	position: relative;
}

.cover {
	height: 220px;
	width: 100%;
	border-radius: 12px;
	background: linear-gradient(120deg, #cfa, #fdc, #9ce, #bbf);
	box-shadow: 0 1px 3px rgba(38, 28, 7, 0.1);

	@include respond-to(mobile) {
		height: 130px;
	}
}

.avatar {
	position: absolute;
	left: 32px;
	bottom: -40px;
	width: 160px;
	height: 160px;
	border-radius: 50%;
	border: 4px solid $color-white;
	box-shadow: 0 2px 8px rgba(38, 28, 7, 0.2);
	overflow: hidden;
	background: $color-accent;

	@include respond-to(mobile) {
		left: 16px;
		bottom: -30px;
		width: 90px;
		height: 90px;
		border-width: 3px;
	}
}

.actionColumn {
	position: absolute;
	right: 24px;
	top: 16px;
	display: flex;
	flex-direction: column;
	row-gap: 12px;
	z-index: 2;

	@include respond-to(mobile) {
		right: 12px;
		top: 12px;
		row-gap: 8px;
	}
}

.diamondBtn {
	transform: rotate(45deg);
	width: 32px;
	height: 32px;
	padding: 0;
	border-radius: 10px;
	background: rgba($color-white, 0.72);
	backdrop-filter: blur(12px);

	@include respond-to(mobile) {
		width: 36px;
		height: 36px;
	}
}

.diamondIcon {
	@include color-black;

	transform: rotate(-45deg);
	width: 18px;
	height: 18px;

	@include respond-to(mobile) {
		width: 16px;
		height: 16px;
	}
}

// ── Name & meta ────────────────────────────────────────────────────

.profileMeta {
	padding-left: 32px;
	padding-top: 40px;
	display: flex;
	flex-direction: column;
	row-gap: 8px;

	@include respond-to(mobile) {
		padding-left: 16px;
		padding-top: 32px;
	}
}

.name {
	@include reset;
	@include title-m;
	@include color-black;

	@include respond-to(mobile) {
		@include title-s;
	}
}

.metaRow {
	display: flex;
	flex-wrap: wrap;
	column-gap: 18px;
	row-gap: 6px;
}

.metaItem {
	@include text-s;
	@include color-black(0.65);

	display: inline-flex;
	align-items: center;
	column-gap: 6px;
}

.metaIcon {
	width: 14px;
	height: 14px;
	flex-shrink: 0;
}

// ── Section ────────────────────────────────────────────────────────

.section {
	display: flex;
	flex-direction: column;
	row-gap: 14px;
}

.sectionHead {
	display: flex;
	justify-content: space-between;
	align-items: center;
	column-gap: 12px;
}

.sectionTitleWrap {
	display: flex;
	align-items: baseline;
	column-gap: 10px;
}

.sectionTitle {
	@include reset;
	@include title-s;
	@include color-black;
}

.sectionCount {
	@include text-s;
	@include color-black(0.5);
}

.sectionLink {
	@include text-s;
	@include color-black(0.6);

	text-decoration: underline;
	cursor: pointer;
}

// ── Gallery (Swiper-обёртка карусели) ─────────────────────────────

.gallery {
	width: 100%;

	// Swiper по умолчанию режет тени снизу из-за overflow: hidden.
	// Разрешаем вертикальное переполнение, горизонтальное — clip,
	// чтобы соседние слайды не торчали за пределы.
	:global(.swiper) {
		overflow: visible !important;
		padding: 8px 0 20px !important;
		margin: -8px 0 -20px !important;
	}

	// Если соседние слайды торчат — режем на уровне .gallery
	overflow-x: clip;
	overflow-y: visible;
	padding: 8px 0 20px;
	margin: -8px 0 -20px;
}

.gallerySlide {
	display: block;
	width: 100%;
	text-decoration: none;
	color: inherit;
}

// ── Event card ─────────────────────────────────────────────────────

.eventCard {
	@include color-white-bg(0.72);
	@include shadow;

	width: 100%;
	min-height: 220px;
	padding: 16px;
	border-radius: 12px;
	backdrop-filter: blur(12px);
	display: flex;
	flex-direction: column;
	row-gap: 10px;
	box-sizing: border-box;
}

.eventCover {
	height: 120px;
	border-radius: 8px;
	background: linear-gradient(135deg, #fde2c4, #ffd1a1, #f7b87f);
	display: flex;
	align-items: flex-end;
	padding: 10px;
	box-sizing: border-box;
}

.eventWhen {
	@include text-xs;
	@include color-black;

	background: $color-white;
	padding: 3px 8px;
	border-radius: 100px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	font-weight: 600;
}

.eventTitle {
	@include reset;
	@include title-xs;
	@include color-black;
}

.eventLocation {
	@include text-s;
	@include color-black(0.6);

	display: flex;
	align-items: center;
	column-gap: 6px;
}

.eventFoot {
	margin-top: auto;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.tagPill {
	@include text-xs;
	@include color-black(0.65);
	@include color-black-bg(0.06);

	padding: 2px 8px;
	border-radius: 100px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}

// ── Product card ───────────────────────────────────────────────────

.productCard {
	@include color-white-bg(0.72);
	@include shadow;

	width: 100%;
	min-height: 250px;
	padding: 14px;
	border-radius: 12px;
	backdrop-filter: blur(12px);
	display: flex;
	flex-direction: column;
	row-gap: 10px;
	box-sizing: border-box;

	@include respond-to(mobile) {
		min-height: 220px;
	}
}

.productImage {
	height: 140px;
	border-radius: 8px;
	background: rgba($color-black, 0.06);
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;

	@include respond-to(mobile) {
		height: 110px;
	}
}

.productImg {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.productImageFallback {
	@include color-black(0.35);

	width: 48px;
	height: 48px;
}

.productName {
	@include reset;
	@include text-m;
	@include color-black;

	font-weight: 600;
}

.productFoot {
	margin-top: auto;
}

.productPrice {
	@include title-xs;
	@include color-black;
}

// ── Service card ───────────────────────────────────────────────────

.serviceCard {
	@include color-white-bg(0.72);
	@include shadow;

	width: 100%;
	min-height: 180px;
	padding: 18px;
	border-radius: 12px;
	backdrop-filter: blur(12px);
	display: flex;
	flex-direction: column;
	row-gap: 12px;
	box-sizing: border-box;
}

.serviceHead {
	display: flex;
	align-items: center;
	column-gap: 12px;
}

.serviceIconBox {
	@include color-accent-bg;

	width: 40px;
	height: 40px;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.serviceHeadIcon {
	@include color-black;

	width: 22px;
	height: 22px;
}

.serviceTitle {
	@include reset;
	@include title-xs;
	@include color-black;
}

.serviceText {
	@include reset;
	@include text-s;
	@include color-black(0.7);

	line-height: 1.5;

	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.servicePrice {
	@include title-xs;
	@include color-black;

	margin-top: auto;
}

// ── Empty state ────────────────────────────────────────────────────

.emptyState {
	@include text-m;
	@include color-black(0.45);

	text-align: center;
	padding: 32px 16px;
}

// ── Wall ───────────────────────────────────────────────────────────

.composer {
	@include color-white-bg(0.72);
	@include shadow;

	padding: 16px;
	border-radius: 12px;
	backdrop-filter: blur(12px);
	display: flex;
	flex-direction: column;
	row-gap: 12px;
}

.composerFoot {
	display: flex;
	align-items: center;
	justify-content: space-between;

	@include respond-to(mobile) {
		flex-direction: column;
		row-gap: 8px;
		align-items: stretch;
	}
}

.composerCounter {
	@include text-xs;
	@include color-black(0.5);
}

.composerError {
	@include text-s;
	@include color-error;

	padding: 8px 12px;
	border-radius: 8px;
	background: rgba($color-error, 0.15);
}

.composerSubmit {
	min-width: 150px;

	@include respond-to(mobile) {
		width: 100%;
	}
}

.wallEmpty {
	@include text-s;
	@include color-black(0.45);

	text-align: center;
	padding: 24px 16px;
}

// ── Posts list ─────────────────────────────────────────────────────

.postsList {
	display: flex;
	flex-direction: column;
	row-gap: 12px;
}

.post {
	@include color-white-bg(0.72);
	@include shadow;

	padding: 20px;
	border-radius: 12px;
	backdrop-filter: blur(12px);
	display: flex;
	flex-direction: column;
	row-gap: 10px;
}

.postHeader {
	display: flex;
	align-items: center;
	column-gap: 8px;
}

.postAuthor {
	@include text-s;
	@include color-black;

	font-weight: 600;
}

.postDot {
	@include text-s;
	@include color-black(0.4);
}

.postDate {
	@include text-s;
	@include color-black(0.55);
}

.postEdited {
	@include text-xs;
	@include color-black(0.4);

	font-style: italic;
}

.postActions {
	margin-left: auto;
	display: flex;
	column-gap: 4px;
}

.postIconBtn {
	@include reset;

	width: 28px;
	height: 28px;
	border-radius: 6px;
	background: transparent;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: background-color $transition-fast;

	&:hover {
		background: rgba($color-black, 0.08);
	}
}

.postActionIcon {
	@include color-black(0.55);

	width: 16px;
	height: 16px;
}

.postContent {
	@include reset;
	@include text-m;
	@include color-black;

	line-height: 1.55;
	white-space: pre-wrap;
	word-break: break-word;
}

.postEditActions {
	display: flex;
	justify-content: flex-end;
	column-gap: 8px;

	@include respond-to(mobile) {
		flex-direction: column-reverse;
		row-gap: 8px;
	}
}

.postCancel {
	min-width: 100px;
}
</style>
