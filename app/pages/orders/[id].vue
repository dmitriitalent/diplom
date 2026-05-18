<script setup lang="ts">
definePageMeta({ middleware: "verified" });

import { useAuthStore } from "~/stores/authStore";
import { useSelfStore } from "~/stores/selfStore";
import { useCacheStore } from "~/stores/cacheStore";
import { useDevice } from "~/composables/device";
import PhotoViewerComponent from "~/components/teleports/PhotoViewerComponent.vue";

const route = useRoute();
const router = useRouter();

const auth = useAuthStore();
const { self } = useSelfStore();
const cacheStore = useCacheStore();
const { deviceClassList } = useDevice();

const isCommandant = auth.isCommandant;

const id = route.params.id as string;
const order = cacheStore.orders.get(id);

if (import.meta.server && !order._loaded) {
	await cacheStore.orders.waitLoaded(id);
}

useSeoMeta({
	title: () => (order as any)?.type || "Заявка",
	description: () =>
		(order as any)?.description || "Заявка в комендатуру общежития",
	robots: "noindex, nofollow",
});

const isAuthor = computed(() => order.authorId === self?.id);
const canEdit = computed(
	() => (isAuthor.value || isCommandant) && order.status === "open",
);

const formatDateTime = (iso: string | null | undefined) => {
	if (!iso) return "";
	const d = new Date(iso);
	return d.toLocaleString("ru-RU", {
		day: "2-digit",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const statusLabel = computed(() => {
	if (order.status === "open") return "Открыта";
	if (order.closeType === "completed") return "Выполнена";
	if (order.closeType === "declined") return "Отклонена";
	return "Закрыта";
});

const viewerOpen = ref(false);
const viewerSrc = ref("");
const openViewer = (guid: string) => {
	viewerSrc.value = `/api/images/byGuid?guid=${guid}`;
	viewerOpen.value = true;
};

const closeForm = ref<{
	closeType: "completed" | "declined" | "";
	closeComment: string;
}>({ closeType: "", closeComment: "" });

const closing = ref(false);
const showCloseDialog = ref(false);

const openCloseDialog = (closeType: "completed" | "declined") => {
	closeForm.value.closeType = closeType;
	closeForm.value.closeComment = "";
	showCloseDialog.value = true;
};

const submitClose = async () => {
	if (!closeForm.value.closeType) return;
	if (
		closeForm.value.closeType === "declined" &&
		!closeForm.value.closeComment.trim()
	) {
		return;
	}
	closing.value = true;
	try {
		await $fetch("/api/order/close?id=" + id, {
			method: "PUT",
			body: closeForm.value,
		});
		cacheStore.orders.invalidate(id);
		showCloseDialog.value = false;
		router.go(0);
	} finally {
		closing.value = false;
	}
};

const handleDelete = async () => {
	await $fetch("/api/order/delete?id=" + id, { method: "DELETE" });
	cacheStore.orders.invalidate(id);
	router.push("/orders");
};

const handleEdit = () => router.push("/orders/edit/" + id);
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<div :class="$style.head">
				<h1 :class="$style.title">
					<span :class="$style.idTag">#{{ order.id }}</span>
					{{ order.type }}
				</h1>
				<span
					:class="[
						$style.badge,
						order.status === 'open'
							? $style.badge_open
							: order.closeType === 'completed'
								? $style.badge_completed
								: $style.badge_declined,
					]"
				>
					{{ statusLabel }}
				</span>
			</div>

			<div
				v-if="order.imageIds && order.imageIds.length"
				:class="$style.galleryWrapper"
			>
				<UiGallery
					:class="$style.gallery"
					:slides-per-view="1"
					:autoplay="3500"
					loop
				>
					<template
						v-for="(guid, index) in order.imageIds"
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

			<div :class="$style.field">
				<h3 :class="$style.label">Описание</h3>
				<p :class="$style.description">
					{{ order.description || "Без описания" }}
				</p>
			</div>

			<div :class="$style.meta">
				<div :class="$style.metaItem">
					<Icon
						name="mdi:account-outline"
						:class="$style.metaIcon"
					/>
					<span>
						{{ order.author?.surname }} {{ order.author?.name }}
						{{ order.author?.patronymic }}
						<template v-if="order.author?.room">
							(комната {{ order.author.room }})
						</template>
					</span>
				</div>
				<div :class="$style.metaItem">
					<Icon
						name="mdi:calendar-plus-outline"
						:class="$style.metaIcon"
					/>
					<span>Создана: {{ formatDateTime(order.createdAt) }}</span>
				</div>
				<div
					v-if="order.updatedAt && order.updatedAt !== order.createdAt"
					:class="$style.metaItem"
				>
					<Icon
						name="mdi:calendar-edit-outline"
						:class="$style.metaIcon"
					/>
					<span>Обновлена: {{ formatDateTime(order.updatedAt) }}</span>
				</div>
				<div v-if="order.closedAt" :class="$style.metaItem">
					<Icon
						name="mdi:calendar-check-outline"
						:class="$style.metaIcon"
					/>
					<span>Закрыта: {{ formatDateTime(order.closedAt) }}</span>
				</div>
			</div>

			<div
				v-if="order.status === 'closed' && order.closeComment"
				:class="[
					$style.closeBlock,
					order.closeType === 'declined' && $style.closeBlock_declined,
				]"
			>
				<h3 :class="$style.label">
					{{
						order.closeType === "declined"
							? "Причина отклонения"
							: "Комментарий к выполнению"
					}}
				</h3>
				<p :class="$style.description">{{ order.closeComment }}</p>
			</div>

			<div :class="$style.actions">
				<UiButton
					v-if="canEdit"
					inset
					@click="handleEdit"
				>
					Редактировать
				</UiButton>
				<UiButton
					v-if="(isAuthor || isCommandant) && order.status === 'open'"
					:class="$style.delete"
					@click="handleDelete"
				>
					Удалить
				</UiButton>
				<template v-if="isCommandant && order.status === 'open'">
					<UiButton accent @click="openCloseDialog('completed')">
						Закрыть как выполненную
					</UiButton>
					<UiButton
						:class="$style.declineBtn"
						@click="openCloseDialog('declined')"
					>
						Отклонить
					</UiButton>
				</template>
			</div>
		</div>

		<Teleport to="body">
			<div
				v-if="showCloseDialog"
				:class="$style.overlay"
				@click="showCloseDialog = false"
			>
				<div :class="$style.dialog" @click.stop>
					<h3 :class="$style.dialogTitle">
						{{
							closeForm.closeType === "declined"
								? "Отклонить заявку"
								: "Закрыть как выполненную"
						}}
					</h3>
					<UiTextarea
						v-model="closeForm.closeComment"
						:rows="5"
						:placeholder="
							closeForm.closeType === 'declined'
								? 'Укажите причину отклонения (обязательно)'
								: 'Комментарий (опционально)'
						"
					/>
					<div :class="$style.dialogActions">
						<UiButton inset @click="showCloseDialog = false">
							Отмена
						</UiButton>
						<UiButton
							accent
							:disabled="
								closing ||
								(closeForm.closeType === 'declined' &&
									!closeForm.closeComment.trim())
							"
							@click="submitClose"
						>
							{{ closing ? "Сохранение..." : "Подтвердить" }}
						</UiButton>
					</div>
				</div>
			</div>
		</Teleport>

		<PhotoViewerComponent v-model:is-opened="viewerOpen" :src="viewerSrc" />
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;

		display: flex;
		flex-direction: column;
		row-gap: 24px;

		@include respond-to(mobile) {
			@include container(mobile);

			row-gap: 18px;
		}
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		column-gap: 12px;
		flex-wrap: wrap;

		.title {
			@include reset;
			@include title-l;
			@include color-black;

			.idTag {
				opacity: 0.4;
				margin-right: 8px;
			}
		}
	}

	.badge {
		@include text-m;

		padding: 4px 12px;
		border-radius: 100px;
		font-weight: 500;

		&.badge_open {
			@include color-warn-bg;
		}
		&.badge_completed {
			@include color-success-bg;
		}
		&.badge_declined {
			@include color-error-bg;
		}
	}

	.galleryWrapper {
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

	.field {
		display: flex;
		flex-direction: column;
		row-gap: 8px;

		.label {
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
		flex-direction: column;
		row-gap: 6px;

		.metaItem {
			@include text-s;
			@include color-black;

			display: flex;
			align-items: center;
			column-gap: 6px;
			opacity: 0.7;

			.metaIcon {
				width: 16px;
				height: 16px;
			}
		}
	}

	.closeBlock {
		@include color-success-bg(0.15);

		padding: 14px 16px;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		row-gap: 6px;

		&.closeBlock_declined {
			@include color-error-bg(0.15);
		}
	}

	.actions {
		display: flex;
		column-gap: 10px;
		flex-wrap: wrap;
		row-gap: 8px;

		.delete {
			@include color-error-bg;
		}

		.declineBtn {
			@include color-error-bg;
		}
	}
}

.overlay {
	@include modal-backdrop;

	position: fixed;
	inset: 0;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	box-sizing: border-box;
}

.dialog {
	@include color-white-bg;
	@include shadow;

	width: 100%;
	max-width: 480px;
	padding: 20px;
	border-radius: 14px;
	display: flex;
	flex-direction: column;
	row-gap: 14px;

	.dialogTitle {
		@include reset;
		@include title-s;
		@include color-black;
	}

	.dialogActions {
		display: flex;
		justify-content: flex-end;
		column-gap: 10px;
	}
}
</style>
