<script setup lang="ts">
useSeoMeta({
	title: "Услуги",
	description:
		"Услуги от жителей общежития: печать, готовка, починка техники, обучение и многое другое.",
});

import type { Service } from "~/entities/Service";
import type { ServiceDtoList } from "~~/server/dto/service/list";
import type { byId } from "~~/server/dto/profile/byId";
import { useDevice } from "~/composables/device";

const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;
const { deviceClassList } = useDevice();

const PAGE_SIZE = 20;

const priceMin = ref<number | undefined>(undefined);
const priceMax = ref<number | undefined>(undefined);

const services = ref<Service[]>([]);
const offset = ref(0);
const hasMore = ref(true);
const loading = ref(false);
const loadingMore = ref(false);

const buildFilterQuery = (): Record<string, any> => {
	const q: Record<string, any> = {};
	if (priceMin.value !== undefined && String(priceMin.value) !== "")
		q.price_min = priceMin.value;
	if (priceMax.value !== undefined && String(priceMax.value) !== "")
		q.price_max = priceMax.value;
	return q;
};

const fetchServices = async (
	query: Record<string, any> = {},
): Promise<Service[]> => {
	const data = await $fetch<ServiceDtoList>("/api/service/list", { query });
	return Promise.all(
		(data.services ?? []).map(async (f) => {
			const ownerFetch = await $fetch<byId>(
				"/api/profile/byId?id=" + f.ownerId,
				{ headers },
			);
			return {
				id: f.id,
				name: f.name,
				description: f.description,
				images: f.images,
				owner: unwrapProfile(ownerFetch),
				price: f.price,
				publishedAt: f.publishedAt,
				status: f.status,
				updatedAt: f.updatedAt,
				viewTemplate: f.viewTemplate,
			} as Service;
		}),
	);
};

const loadMore = async () => {
	if (loadingMore.value || !hasMore.value) return;
	loadingMore.value = true;
	try {
		const items = await fetchServices({
			...buildFilterQuery(),
			limit: PAGE_SIZE,
			offset: offset.value,
		});
		services.value.push(...items);
		offset.value += items.length;
		if (items.length < PAGE_SIZE) hasMore.value = false;
	} finally {
		loadingMore.value = false;
	}
};

const loadServices = async () => {
	loading.value = true;
	services.value = [];
	offset.value = 0;
	hasMore.value = true;
	try {
		await loadMore();
	} finally {
		loading.value = false;
	}
};

await loadMore();
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<div :class="$style.toolbar">
				<RouterLink to="/services/create">
					<UiButton accent>Предложить услугу</UiButton>
				</RouterLink>

				<div :class="$style.filters">
					<div :class="$style.filterField">
						<span :class="$style.filterLabel">Цена от</span>
						<UiInput
							v-model="priceMin"
							type="number"
							placeholder="0"
							:class="$style.filterInput"
						/>
					</div>
					<div :class="$style.filterField">
						<span :class="$style.filterLabel">Цена до</span>
						<UiInput
							v-model="priceMax"
							type="number"
							placeholder="99999"
							:class="$style.filterInput"
						/>
					</div>
					<UiButton inset @click="loadServices" :disabled="loading">
						{{ loading ? "Загрузка..." : "Применить" }}
					</UiButton>
				</div>
			</div>

			<div v-if="loading" :class="$style.empty">Загрузка...</div>
			<div v-else-if="services.length === 0" :class="$style.empty">
				Услуг не найдено
			</div>

			<ServicePlateComponent
				v-for="service in services"
				:key="service.id"
				:service="service"
			/>

			<ObserverComponent v-if="hasMore" @intersect="loadMore" />
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

		@include respond-to(mobile) {
			@include container(mobile);
		}
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		row-gap: 10px;
		column-gap: 20px;

		@include respond-to(mobile) {
			flex-direction: column;
			align-items: stretch;
		}

		.filters {
			display: flex;
			align-items: center;
			column-gap: 15px;

			@include respond-to(mobile) {
				flex-wrap: wrap;
				row-gap: 10px;
			}

			.filterField {
				display: flex;
				align-items: center;
				column-gap: 8px;

				.filterLabel {
					@include text-s;
					@include color-black;

					white-space: nowrap;
				}

				.filterInput {
					width: 100px;
				}
			}
		}
	}

	.empty {
		@include text-m;
		@include color-black;

		opacity: 0.5;
		text-align: center;
		padding: 40px 0;
	}
}
</style>
