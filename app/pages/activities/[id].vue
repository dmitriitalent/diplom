<script setup lang="ts">
import type { User } from "~/entities/User";
import type { Dormitory } from "~/entities/Dormitory";
import { useAuthStore } from "~/stores/authStore";
import { useSelfStore } from "~/stores/selfStore";
import { useCacheStore } from "~/stores/cacheStore";
import { jwtDecode } from "jwt-decode";

const route = useRoute();
const router = useRouter();

const { at } = useAuthStore();
const isAdmin = jwtDecode(at as string).roles.includes("ADMIN");
const cacheStore = useCacheStore();
const { self } = useSelfStore();

const id = route.params.id as string;
const activity = cacheStore.activities.get(id);

if (import.meta.server && !activity._loaded) {
	await cacheStore.activities.waitLoaded(id);
}

const isAuthor = computed(() => activity.author?.id === self?.id);
const isParticipant = computed(() => !!activity.participants?.find((p: any) => p.id == self?.id));

const templateMap: Record<number, ReturnType<typeof defineAsyncComponent>> = {
	0: defineAsyncComponent(() => import("~/components/templates/activity/ActivityTemplate0.vue")),
	1: defineAsyncComponent(() => import("~/components/templates/activity/ActivityTemplate1.vue")),
};

const templateComponent = computed(() => templateMap[(activity as any).viewTemplate ?? 0] ?? templateMap[0]);

const moderateForm = ref({ comment: "", status: "" });
const inviteCode = ref<string | null>(null);

const handleDelete = () => {
	$fetch("/api/activity/delete?id=" + id, { method: "DELETE" }).then(() => {
		cacheStore.activities.invalidate(id);
		router.push("/activities");
	});
};

const handleEdit = () => router.push("/activities/edit/" + activity.id);

const handleModerate = (status: string) => {
	moderateForm.value.status = status;
	$fetch("/api/activity/moderate?id=" + id, {
		body: moderateForm.value,
		method: "PUT",
		credentials: "include",
	}).then(() => {
		activity.moderationStatus = status;
	});
};

const buildSelfUser = (): User =>
	({
		id: unwrapField(self?.id),
		login: unwrapField(self?.login),
		educationEmail: unwrapField(self?.educationEmail),
		birthdate: new Date(),
		dormitory: {} as Dormitory,
		building: unwrapField(self?.building),
		floor: unwrapField(self?.floor),
		room: unwrapField(self?.room),
		surname: unwrapField(self?.surname),
		name: unwrapField(self?.name),
		patronymic: unwrapField(self?.patronymic),
		contacts: [],
		friends: [],
	}) as User;

const handleJoin = () => {
	$fetch("/api/activity/register", {
		method: "POST",
		body: { id },
		credentials: "include",
	}).then(() => {
		const list = (activity.participants as any[] | undefined) ?? [];
		(activity as any).participants = [...list, buildSelfUser()];
	});
};

const handleLeave = () => {
	const list = (activity.participants as any[] | undefined) ?? [];
	(activity as any).participants = list.filter((p: any) => p.id !== self?.id);
	$fetch("/api/activity/unregister", {
		method: "DELETE",
		body: { id },
		credentials: "include",
	}).then(() => {
		if (activity.isPrivate) router.push("/activities");
	});
};

const handleGenerateInvite = (form: { expiresAt: string; maxUses: number }) => {
	$fetch("/api/activity/invite?id=" + id, {
		body: form,
		method: "POST",
		credentials: "include",
	}).then((res: any) => {
		inviteCode.value = res.code;
	});
};
</script>

<template>
	<component
		:is="templateComponent"
		:activity="activity"
		:isAdmin="isAdmin"
		:isAuthor="isAuthor"
		:isParticipant="isParticipant"
		:moderateForm="moderateForm"
		:inviteCode="inviteCode"
		@delete="handleDelete"
		@edit="handleEdit"
		@moderate="handleModerate"
		@join="handleJoin"
		@leave="handleLeave"
		@generate-invite="handleGenerateInvite"
	/>
</template>
