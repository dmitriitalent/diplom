<script setup lang="ts">
definePageMeta({ middleware: "verified" });

useSeoMeta({
	title: "Игровая комната",
	robots: "noindex, nofollow",
});

import { useDevice } from "~/composables/device";
import { useAuthStore } from "~/stores/authStore";
import { useGameRoom } from "~/composables/useGameRoom";
import RoomLobby from "~/components/games/RoomLobby.vue";
import AliasGame from "~/components/games/AliasGame.vue";
import PapersGame from "~/components/games/PapersGame.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { deviceClassList } = useDevice();

const id = route.params.id as string;
const selfUserId = computed(() => auth.userId ?? "");

const { data: initial, error: initError } = await useAsyncData(
	"game-room-" + id,
	() => $fetch<any>("/api/games/byId?id=" + id),
);

if (!initial.value) {
	throw createError({
		statusCode: initError.value?.statusCode ?? 404,
		message:
			(initError.value as any)?.data?.message ?? "Комната не найдена",
	});
}

const manifest = ref<{ ru: any[]; en: any[] }>({ ru: [], en: [] });
const { data: m } = await useAsyncData("games-dicts", () =>
	$fetch<any>("/api/games/dicts"),
);
if (m.value) manifest.value = m.value;

const ws = useGameRoom(id);
const room = computed(() => ws.room.value ?? initial.value);

const handleUpdate = (settings: any) => {
	ws.send({ type: "settings-update", settings });
};

const handleStart = () => {
	ws.send({ type: "start-game" });
};

const handleKick = (userId: string) => {
	ws.send({ type: "kick", userId });
};

const handleLeave = () => {
	ws.leave();
	router.push("/games");
};

const handleSend = (msg: any) => ws.send(msg);
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<div v-if="ws.error.value" :class="$style.error">
				{{ ws.error.value }}
			</div>

			<template v-if="room">
				<RoomLobby
					v-if="room.status === 'lobby'"
					:room="room"
					:self-user-id="selfUserId"
					:manifest="manifest"
					@update-settings="handleUpdate"
					@start="handleStart"
					@kick="handleKick"
					@leave="handleLeave"
				/>

				<template v-else>
					<div :class="$style.header">
						<RouterLink to="/games">
							<UiButton inset>
								<Icon name="mdi:arrow-left" />
								К списку
							</UiButton>
						</RouterLink>
						<UiButton :class="$style.leaveBtn" @click="handleLeave">
							Выйти из комнаты
						</UiButton>
					</div>

					<AliasGame
						v-if="room.game === 'alias'"
						:room="room"
						:self-user-id="selfUserId"
						@send="handleSend"
					/>
					<PapersGame
						v-if="room.game === 'papers'"
						:room="room"
						:self-user-id="selfUserId"
						@send="handleSend"
					/>
				</template>
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
		row-gap: 16px;

		@include respond-to(mobile) {
			@include container(mobile);
		}
	}
}

.header {
	display: flex;
	justify-content: space-between;
	column-gap: 10px;
}

.leaveBtn {
	@include color-error-bg;
}

.error {
	@include color-error-bg;
	@include text-s;

	padding: 10px 14px;
	border-radius: 10px;
}
</style>
