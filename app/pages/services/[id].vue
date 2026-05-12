<script setup lang="ts">
import type { ServiceComment } from "~/entities/Service";
import { useAuthStore } from "~/stores/authStore";
import { useSelfStore } from "~/stores/selfStore";
import { useCacheStore } from "~/stores/cacheStore";
import { jwtDecode } from "jwt-decode";

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const { at } = useAuthStore();
const { self } = useSelfStore();
const isAdmin = jwtDecode(at as string).roles.includes("ADMIN");
const cacheStore = useCacheStore();

const service = cacheStore.services.get(id);

if (import.meta.server && !service._loaded) {
	await cacheStore.services.waitLoaded(id);
}

const isOwner = computed(() => service.owner?.id === self?.id);

const templateMap: Record<number, ReturnType<typeof defineAsyncComponent>> = {
	0: defineAsyncComponent(() => import("~/components/templates/services/ServiceTemplate0.vue")),
	1: defineAsyncComponent(() => import("~/components/templates/services/ServiceTemplate1.vue")),
};

const templateComponent = computed(() => templateMap[(service as any).viewTemplate ?? 0] ?? templateMap[0]);

const handleDelete = () => {
	$fetch("/api/service/delete?id=" + id, { method: "DELETE" }).then(() => {
		cacheStore.services.invalidate(id);
		router.push("/services");
	});
};

const handleEdit = () => router.push("/services/edit/" + service.id);

const handleAddComment = async (body: string) => {
	const res = await $fetch<{
		id: string;
		authorId: string;
		body: string;
		publishedAt: string;
		updatedAt: string;
		listingId: string;
	}>("/api/service/comments?id=" + id, {
		method: "POST",
		body: { body },
	});
	if (!service.comments) (service as any).comments = [];
	service.comments!.push({
		id: res.id,
		listingId: res.listingId,
		authorId: res.authorId,
		author: {
			id: unwrapField(self?.id),
			login: unwrapField(self?.login),
			educationEmail: unwrapField(self?.educationEmail),
			birthdate: new Date(),
			dormitory: {} as any,
			building: unwrapField(self?.building),
			floor: unwrapField(self?.floor),
			room: unwrapField(self?.room),
			surname: unwrapField(self?.surname),
			name: unwrapField(self?.name),
			patronymic: unwrapField(self?.patronymic),
			contacts: [],
			friends: [],
		},
		body: res.body,
		publishedAt: res.publishedAt,
		updatedAt: res.updatedAt,
	} as ServiceComment);
};
</script>

<template>
	<component
		:is="templateComponent"
		:service="service"
		:isAdmin="isAdmin"
		:isOwner="isOwner"
		@delete="handleDelete"
		@edit="handleEdit"
		@add-comment="handleAddComment"
	/>
</template>
