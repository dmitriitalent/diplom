import type { Activity } from "~/entities/Activity";
import type { News } from "~/entities/News";
import type { Product } from "~/entities/Product";
import type { Service } from "~/entities/Service";
import type { ServiceComment } from "~/entities/Service";
import type { User } from "~/entities/User";
import type { ActivityDtoById } from "~~/server/dto/activity/byId";
import type { NewsDtoById } from "~~/server/dto/news/byId";
import type { byIdProduct } from "~~/server/dto/product/byId";
import type { ServiceDtoById } from "~~/server/dto/service/byId";
import type { ServiceCommentsListDto } from "~~/server/dto/service/comment";
import type { byId } from "~~/server/dto/profile/byId";

const CACHE_LIMIT = 7;

export type Cached<T> = Partial<T> & { id: string; _loaded: boolean };

type CacheRecord<T> = Record<string, Cached<T>>;

function getHeaders(): HeadersInit | undefined {
	return import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchFullNews(id: string): Promise<Partial<News>> {
	const headers = getHeaders();
	const newsFetch = await $fetch<NewsDtoById>("/api/news/byId?id=" + id, {
		headers,
	});
	const authorFetch = await $fetch<byId>(
		"/api/profile/byId?id=" + newsFetch.authorId,
		{ headers, credentials: "include" },
	);
	return {
		id: newsFetch.id,
		title: newsFetch.title,
		content: newsFetch.content,
		imageIds: newsFetch.imageIds,
		activityIds: newsFetch.activityIds,
		createdAt: newsFetch.createdAt,
		dormitoryId: newsFetch.dormitoryId,
		moderationComment: newsFetch.moderationComment,
		moderationStatus: newsFetch.moderationStatus,
		productIds: newsFetch.productIds,
		reactionCount: newsFetch.reactionCount,
		updatedAt: newsFetch.updatedAt,
		userReaction: newsFetch.userReaction,
		viewTemplate: newsFetch.viewTemplate,
		author: unwrapProfile(authorFetch),
	};
}

async function fetchFullActivity(id: string): Promise<Partial<Activity>> {
	const headers = getHeaders();
	const activityFetch = await $fetch<ActivityDtoById>(
		"/api/activity/byId?id=" + id,
		{ headers },
	);
	const authorFetch = await $fetch<byId>(
		"/api/profile/byId?id=" + activityFetch.createdBy,
		{ headers, credentials: "include" },
	);

	let participants: Array<User> = [];
	if (activityFetch.participants?.length) {
		participants = await Promise.all(
			activityFetch.participants.map(async (p) => {
				const profile = await $fetch<byId>(
					"/api/profile/byId?id=" + p.userId,
					{ headers, credentials: "include" },
				);
				return unwrapProfile(profile);
			}),
		);
	}

	return {
		id: activityFetch.id,
		title: activityFetch.title,
		description: activityFetch.description,
		dormitoryId: activityFetch.dormitoryId,
		startTime: activityFetch.startTime,
		endTime: activityFetch.endTime,
		imageIds: activityFetch.imageIds,
		isPrivate: activityFetch.isPrivate,
		location: activityFetch.location,
		moderationComment: activityFetch.moderationComment,
		moderationStatus: activityFetch.moderationStatus,
		createdAt: activityFetch.createdAt,
		updatedAt: activityFetch.updatedAt,
		viewTemplate: activityFetch.viewTemplate,
		author: unwrapProfile(authorFetch),
		// Сохраняем актуальный список User[] в participants (как делают detail-страницы).
		participants: participants as any,
	};
}

async function fetchFullProduct(id: string): Promise<Partial<Product>> {
	const headers = getHeaders();
	const productFetch = await $fetch<byIdProduct>("/api/product/byId?id=" + id, {
		headers,
	});
	const ownerFetch = await $fetch<byId>(
		"/api/profile/byId?id=" + productFetch.ownerId,
		{ headers, credentials: "include" },
	);
	return {
		id: productFetch.id,
		name: productFetch.name,
		description: productFetch.description,
		images: productFetch.images,
		price: productFetch.price,
		publishedAt: productFetch.publishedAt,
		status: productFetch.status,
		updatedAt: productFetch.updatedAt,
		viewTemplate: productFetch.viewTemplate,
		owner: unwrapProfile(ownerFetch),
	};
}

async function fetchFullService(id: string): Promise<Partial<Service>> {
	const headers = getHeaders();
	const s = await $fetch<ServiceDtoById>("/api/service/byId?id=" + id, {
		headers,
	});
	const ownerFetch = await $fetch<byId>(
		"/api/profile/byId?id=" + s.ownerId,
		{ headers, credentials: "include" },
	);

	// Комментарии тянем здесь же, чтобы кэш содержал их при дозапросе.
	const commentsRes = await $fetch<ServiceCommentsListDto>(
		"/api/service/comments?id=" + id,
		{ headers },
	);
	const comments: ServiceComment[] = await Promise.all(
		(commentsRes.comments ?? []).map(async (c) => {
			const authorFetch = await $fetch<byId>(
				"/api/profile/byId?id=" + c.authorId,
				{ headers, credentials: "include" },
			);
			return {
				id: c.id,
				listingId: c.listingId,
				authorId: c.authorId,
				author: unwrapProfile(authorFetch),
				body: c.body,
				publishedAt: c.publishedAt,
				updatedAt: c.updatedAt,
			};
		}),
	);

	return {
		id: s.id,
		name: s.name,
		description: s.description,
		images: s.images,
		price: s.price,
		publishedAt: s.publishedAt,
		status: s.status,
		updatedAt: s.updatedAt,
		viewTemplate: s.viewTemplate,
		owner: unwrapProfile(ownerFetch),
		// `comments` — опциональное поле, добавлено в Service entity для кэша.
		comments,
	};
}

// ─── Cache factory ───────────────────────────────────────────────────────────

function makeCache<T extends { id: string }>(
	state: Ref<CacheRecord<T>>,
	order: Ref<string[]>,
	fetcher: (id: string) => Promise<Partial<T>>,
) {
	// Map<id, Promise> для дедупа параллельных fetch одного и того же id.
	const inFlight = new Map<string, Promise<void>>();

	function touch(id: string) {
		const idx = order.value.indexOf(id);
		if (idx !== -1) order.value.splice(idx, 1);
		order.value.push(id);
	}

	function evictIfNeeded() {
		while (order.value.length >= CACHE_LIMIT) {
			const oldest = order.value.shift();
			if (oldest) delete state.value[oldest];
		}
	}

	function refresh(id: string, entry: Cached<T>) {
		if (inFlight.has(id)) return;
		const p = fetcher(id)
			.then((full) => {
				Object.assign(entry, full);
				entry._loaded = true;
			})
			.catch((err) => {
				console.error("[cacheStore] fetch failed for id=" + id, err);
			})
			.finally(() => {
				inFlight.delete(id);
			});
		inFlight.set(id, p);
	}

	function get(id: string): Cached<T> {
		let entry = state.value[id];
		if (entry) {
			touch(id);
		} else {
			evictIfNeeded();
			entry = reactive({ id, _loaded: false }) as Cached<T>;
			state.value[id] = entry;
			order.value.push(id);
		}
		refresh(id, entry);
		return entry;
	}

	function set(partial: Partial<T> & { id: string }) {
		const id = partial.id;
		const existing = state.value[id];
		if (existing) {
			Object.assign(existing, partial);
			touch(id);
		} else {
			evictIfNeeded();
			const entry = reactive({
				...partial,
				_loaded: false,
			}) as Cached<T>;
			state.value[id] = entry;
			order.value.push(id);
		}
	}

	function invalidate(id: string) {
		delete state.value[id];
		const idx = order.value.indexOf(id);
		if (idx !== -1) order.value.splice(idx, 1);
		inFlight.delete(id);
	}

	function waitLoaded(id: string): Promise<void> {
		return inFlight.get(id) ?? Promise.resolve();
	}

	return { get, set, invalidate, waitLoaded };
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCacheStore = defineStore("cacheStore", () => {
	// State — простые объекты, чтобы Pinia мог сериализовать их при SSR.
	const newsState = ref<CacheRecord<News>>({});
	const newsOrder = ref<string[]>([]);

	const activitiesState = ref<CacheRecord<Activity>>({});
	const activitiesOrder = ref<string[]>([]);

	const productsState = ref<CacheRecord<Product>>({});
	const productsOrder = ref<string[]>([]);

	const servicesState = ref<CacheRecord<Service>>({});
	const servicesOrder = ref<string[]>([]);

	const news = makeCache<News>(newsState, newsOrder, fetchFullNews);
	const activities = makeCache<Activity>(
		activitiesState,
		activitiesOrder,
		fetchFullActivity,
	);
	const products = makeCache<Product>(
		productsState,
		productsOrder,
		fetchFullProduct,
	);
	const services = makeCache<Service>(
		servicesState,
		servicesOrder,
		fetchFullService,
	);

	return {
		// state — экспортируем, чтобы Pinia их видел и сериализовал.
		newsState,
		newsOrder,
		activitiesState,
		activitiesOrder,
		productsState,
		productsOrder,
		servicesState,
		servicesOrder,
		// API
		news,
		activities,
		products,
		services,
	};
});
