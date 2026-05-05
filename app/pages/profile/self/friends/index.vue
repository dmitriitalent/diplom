<script setup lang="ts">
import type { byId } from "~~/server/dto/profile/byId";

type Tab = "friends" | "requests";
const tab = ref<Tab>("friends");

const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;

const fetchProfile = (id: string) =>
	$fetch<byId>(`/api/profile/byId?id=${id}`, { headers });

// ─── Friends ──────────────────────────────────────────────────────────────────

const { data: friendIds, refresh: refreshFriends } = await useAsyncData(
	"friend-list",
	async () => {
		const res = await $fetch<{ friends: string[] }>("/api/friend/list", {
			headers,
		});
		return res.friends ?? [];
	},
);

const { data: friendProfiles, refresh: refreshFriendProfiles } =
	await useAsyncData("friend-profiles", async () => {
		const ids = friendIds.value ?? [];
		if (ids.length === 0) return [];
		return Promise.all(ids.map(fetchProfile));
	});

// ─── Incoming requests ────────────────────────────────────────────────────────

const { data: pendingInIds, refresh: refreshPendingIn } = await useAsyncData(
	"friend-pending-in",
	async () => {
		const res = await $fetch<{ pending_in: string[] }>(
			"/api/friend/pendingIn",
			{ headers },
		);
		return res.pending_in ?? [];
	},
);

const { data: pendingInProfiles, refresh: refreshPendingInProfiles } =
	await useAsyncData("friend-pending-in-profiles", async () => {
		const ids = pendingInIds.value ?? [];
		if (ids.length === 0) return [];
		return Promise.all(ids.map(fetchProfile));
	});

// ─── Actions ──────────────────────────────────────────────────────────────────

const deleteFriend = async (id: string) => {
	await $fetch(`/api/friend/delete?friendId=${id}`, { method: "DELETE" });
	await refreshFriends();
	await refreshFriendProfiles();
};

const acceptRequest = async (id: string) => {
	await $fetch(`/api/friend/accept?friendId=${id}`, { method: "POST" });
	await refreshPendingIn();
	await refreshPendingInProfiles();
	await refreshFriends();
	await refreshFriendProfiles();
};

const declineRequest = async (id: string) => {
	await $fetch(`/api/friend/decline?friendId=${id}`, { method: "POST" });
	await refreshPendingIn();
	await refreshPendingInProfiles();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const profileLocation = (p: byId) => {
	const building = unwrapField(p.building);
	const room = unwrapField(p.room);
	if (building && room) return `Корпус ${building}, комната ${room}`;
	if (building) return `Корпус ${building}`;
	return undefined;
};
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.container">
			<div :class="$style.header">
				<h1 :class="$style.title">Друзья</h1>
				<div :class="$style.tabs">
					<UiButton
						:class="[$style.tabBtn, tab === 'friends' && $style.tabBtnActive]"
						inset
						@click="tab = 'friends'"
					>
						Друзья
						<span
							v-if="friendProfiles?.length"
							:class="$style.badge"
						>{{ friendProfiles.length }}</span>
					</UiButton>
					<UiButton
						:class="[$style.tabBtn, tab === 'requests' && $style.tabBtnActive]"
						inset
						@click="tab = 'requests'"
					>
						Заявки
						<span
							v-if="pendingInProfiles?.length"
							:class="$style.badge"
						>{{ pendingInProfiles.length }}</span>
					</UiButton>
				</div>
			</div>

			<!-- Friends tab -->
			<template v-if="tab === 'friends'">
				<div v-if="!friendProfiles?.length" :class="$style.empty">
					Пока нет друзей
				</div>
				<div v-else :class="$style.list">
					<ProfileFriendPlate
						v-for="p in friendProfiles"
						:key="unwrapField(p.id)"
						:id="unwrapField(p.id)"
						:name="unwrapField(p.name)"
						:surname="unwrapField(p.surname)"
						:location="profileLocation(p)"
						:contacts="p.contacts ?? []"
						@delete="deleteFriend"
					/>
				</div>
			</template>

			<!-- Requests tab -->
			<template v-if="tab === 'requests'">
				<div v-if="!pendingInProfiles?.length" :class="$style.empty">
					Нет входящих заявок
				</div>
				<div v-else :class="$style.list">
					<div
						v-for="p in pendingInProfiles"
						:key="unwrapField(p.id)"
						:class="$style.requestPlate"
						@click="$router.push(`/profile/${unwrapField(p.id)}`)"
					>
						<div :class="$style.requestInfo">
							<span :class="$style.requestName">
								{{ unwrapField(p.name) }} {{ unwrapField(p.surname) }}
							</span>
							<span
								v-if="profileLocation(p)"
								:class="$style.requestLocation"
							>
								{{ profileLocation(p) }}
							</span>
						</div>
						<div :class="$style.requestActions" @click.stop>
							<UiButton
								:class="$style.declineBtn"
								@click="declineRequest(p.id)"
							>
								Отклонить
							</UiButton>
							<UiButton accent @click="acceptRequest(p.id)">
								Добавить
							</UiButton>
						</div>
					</div>
				</div>
			</template>
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
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;

		.title {
			@include reset;
			@include title-l;
			@include color-black;
		}

		.tabs {
			display: flex;
			column-gap: 8px;
		}

		.tabBtn {
			position: relative;
		}

		.tabBtnActive {
			@include color-black-bg(0.1);
		}

		.badge {
			@include text-s;

			display: inline-flex;
			align-items: center;
			justify-content: center;
			background: rgba(0, 0, 0, 0.12);
			border-radius: 100px;
			padding: 0 6px;
			height: 18px;
			min-width: 18px;
			margin-left: 6px;
			font-size: 11px;
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

	// ── Request plate ──────────────────────────────────────────────────────

	.requestPlate {
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

		.requestInfo {
			display: flex;
			flex-direction: column;
			row-gap: 4px;

			.requestName {
				@include title-s;
				@include color-black;
			}

			.requestLocation {
				@include text-s;
				@include color-black;

				opacity: 0.55;
			}
		}

		.requestActions {
			display: flex;
			column-gap: 8px;

			.declineBtn {
				@include color-error-bg;
			}
		}
	}
}
</style>
