<script setup lang="ts">
import type { Service } from "~/entities/Service";
import type { ServiceDtoList } from "~~/server/dto/service/list";
import type { byId } from "~~/server/dto/profile/byId";

const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;

const priceMin = ref<number | undefined>(undefined);
const priceMax = ref<number | undefined>(undefined);


const fetchServices = async (query: Record<string, any> = {}): Promise<Service[]> => {
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

const { data: initialServices } = await useAsyncData<Service[]>(
	"services-list",
	() => fetchServices(),
);

const services = ref<Service[]>(initialServices.value ?? []);
const loading = ref(false);

const loadServices = async () => {
	loading.value = true;
	try {
		const q: Record<string, any> = {};
		if (priceMin.value !== undefined && String(priceMin.value) !== "") q.price_min = priceMin.value;
		if (priceMax.value !== undefined && String(priceMax.value) !== "") q.price_max = priceMax.value;
		services.value = await fetchServices(q);
	} finally {
		loading.value = false;
	}
};
</script>

<template>
	<div :class="$style.wrapper">
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

			<RouterLink
				v-for="service in services"
				:key="service.id"
				:to="`/services/${service.id}`"
			>
				<ServicePlateComponent :service="service" />
			</RouterLink>
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
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		row-gap: 10px;
		column-gap: 20px;

		.filters {
			display: flex;
			align-items: center;
			column-gap: 15px;

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
