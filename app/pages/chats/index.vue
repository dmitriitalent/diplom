<script setup lang="ts">
useSeoMeta({
	title: "Чаты",
	description: "Чаты с соседями и тематические каналы общежития.",
	robots: "noindex, nofollow",
});

import type { byId } from "~~/server/dto/profile/byId";
import { useDevice } from "~/composables/device";

const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;
const { deviceClassList } = useDevice();

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
