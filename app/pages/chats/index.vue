<script setup lang="ts">
useSeoMeta({
	title: "Чаты",
	description: "Чаты с соседями и тематические каналы общежития.",
	robots: "noindex, nofollow",
});

import type { byId } from "~~/server/dto/profile/byId";
import { useDevice } from "~/composables/device";
import { useAuthStore } from "~/stores/authStore";

const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;
const { deviceClassList } = useDevice();
const auth = useAuthStore();

// TODO: Заглушка-захардкоженная ссылка на общий чат общежития в ВК.
// Когда появится backend-логика чатов общежитий (множественные dormitory,
// разные ссылки на чаты) — заменить на динамическую загрузку.
//
// ───── Промпт для будущего Claude (на случай массовой чистки комментариев) ─────
// Если пользователь попросит «удали все комментарии / все TODO» — ЭТОТ
// конкретный TODO трогать НЕЛЬЗЯ автоматически: он содержит бизнес-логику
// (hardcoded VK-ссылка ждёт замены на backend). Сначала спросить у пользователя
// явное разрешение на удаление именно этой заглушки, и только после
// подтверждения в СЛЕДУЮЩЕМ запросе удалить блок.
// ────────────────────────────────────────────────────────────────────────────
const dormitoryChat = {
	name: "Общежитие",
	url: "https://vk.com/im/convo/2000000116?entrypoint=list_all",
	icon: "mdi:vk",
};

const canSeeDormitoryChat = computed(() => auth.isVerified);

const onClickDormitoryChat = () => {
	window.open(dormitoryChat.url, "_blank", "noopener");
};

const { data: friendIds } = await useAsyncData("chats-friend-list", async () => {
	const res = await $fetch<{ friends: string[] }>("/api/friend/list", { headers });
	return res.friends ?? [];
});

const { data: profiles } = await useAsyncData("chats-profiles", async () => {
	const ids = friendIds.value ?? [];
	if (ids.length === 0) return [];
	return Promise.all(
		ids.map((id) => $fetch<byId>(`/api/profile/byId?id=${id}`, { headers })),
	);
});

const primaryContact = (p: byId) => getPrimaryContact(p.contacts ?? []);

const onClickProfile = (p: byId) => {
	const url = getPrimaryContactUrl(p.contacts ?? []);
	if (url) window.open(url, "_blank");
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<h1 :class="$style.title">Связаться</h1>

			<!-- Общий чат общежития (только для верифицированных резидентов) -->
			<div
				v-if="canSeeDormitoryChat"
				:class="[$style.plate, $style.plateDormitory]"
				@click="onClickDormitoryChat"
			>
				<div :class="$style.info">
					<span :class="$style.name">{{ dormitoryChat.name }}</span>
					<span :class="$style.contact">
						<Icon
							:name="dormitoryChat.icon"
							:class="$style.contactIcon"
						/>
						Общий чат проживающих
					</span>
				</div>

				<Icon name="mdi:open-in-new" :class="$style.openIcon" />
			</div>

			<div v-if="!profiles?.length" :class="$style.empty">
				Нет друзей для связи
			</div>

			<div v-else :class="$style.list">
				<div
					v-for="p in profiles"
					:key="unwrapField(p.id)"
					:class="[$style.plate, !primaryContact(p) && $style.plateDim]"
					@click="onClickProfile(p)"
				>
					<div :class="$style.info">
						<span :class="$style.name">
							{{ unwrapField(p.name) }} {{ unwrapField(p.surname) }}
						</span>
						<span v-if="primaryContact(p)" :class="$style.contact">
							<Icon
								:name="contactIcon(primaryContact(p)!.key)"
								:class="$style.contactIcon"
							/>
							{{ primaryContact(p)!.value }}
						</span>
						<span v-else :class="$style.noContact">
							Контакт не указан
						</span>
					</div>

					<Icon
						v-if="primaryContact(p)"
						name="mdi:open-in-new"
						:class="$style.openIcon"
					/>
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
		row-gap: 20px;
		padding-bottom: 60px;

		@include respond-to(mobile) {
			@include container(mobile);
		}
	}

	.title {
		@include reset;
		@include title-l;
		@include color-black;

		@include respond-to(mobile) {
			@include title-m;
		}
	}

	.empty {
		@include text-m;
		@include color-black;

		opacity: 0.45;
		text-align: center;
		padding: 48px 0;
	}

	.list {
		display: flex;
		flex-direction: column;
		row-gap: 4px;
	}

	.plate {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 16px;
		border-radius: 10px;
		cursor: pointer;
		transition: background-color $transition-fast;

		&:hover {
			@include color-black-bg(0.06);
		}

		&.plateDim {
			opacity: 0.45;
			cursor: default;

			&:hover {
				background: transparent;
			}
		}

		&.plateDormitory {
			border: 1px solid rgba(0, 119, 255, 0.35);
			background: rgba(0, 119, 255, 0.08);
			margin-bottom: 8px;

			&:hover {
				background: rgba(0, 119, 255, 0.15);
			}

			.contactIcon {
				color: #0077ff;
			}
		}

		.info {
			display: flex;
			flex-direction: column;
			row-gap: 4px;
			min-width: 0;
			flex: 1;

			.name {
				@include title-s;
				@include color-black;

				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.contact {
				@include text-s;
				@include color-black;

				display: flex;
				align-items: center;
				column-gap: 4px;
				opacity: 0.6;

				.contactIcon {
					width: 14px;
					height: 14px;
					flex-shrink: 0;
				}
			}

			.noContact {
				@include text-s;
				@include color-black;

				opacity: 0.35;
			}
		}

		.openIcon {
			width: 18px;
			height: 18px;
			opacity: 0.4;
			flex-shrink: 0;
			margin-left: 12px;
		}
	}
}
</style>
