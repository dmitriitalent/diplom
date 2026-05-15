<script setup lang="ts">
useSeoMeta({
	title: "Закладки",
	description:
		"Сохранённые товары, услуги и мероприятия Hostelite.",
	robots: "noindex, nofollow",
});

import { useDevice } from "~/composables/device";
import type { byIdProduct } from "~~/server/dto/product/byId";
import type { ServiceDtoById } from "~~/server/dto/service/byId";
import type { ActivityDtoById } from "~~/server/dto/activity/byId";

const { deviceClassList } = useDevice();
const headers = useRequestHeaders(["cookie"]);

const productsBm = useBookmarks("product");
const servicesBm = useBookmarks("service");
const activitiesBm = useBookmarks("activity");

type ProductItem = byIdProduct & { _missing?: boolean };
type ServiceItem = ServiceDtoById & { _missing?: boolean };
type ActivityItem = ActivityDtoById & { _missing?: boolean };

const products = ref<ProductItem[]>([]);
const services = ref<ServiceItem[]>([]);
const activities = ref<ActivityItem[]>([]);
const loading = ref(true);

const fetchOne = async <T,>(url: string, id: string): Promise<T | null> => {
	try {
		return await $fetch<T>(url + id, { headers });
	} catch {
		return null;
	}
};

const loadAll = async () => {
	loading.value = true;
	try {
		const [p, s, a] = await Promise.all([
			Promise.all(
				productsBm.ids.value.map((id) =>
					fetchOne<byIdProduct>("/api/product/byId?id=", id).then(
						(v) => v ?? ({ id, _missing: true } as ProductItem),
					),
				),
			),
			Promise.all(
				servicesBm.ids.value.map((id) =>
					fetchOne<ServiceDtoById>("/api/service/byId?id=", id).then(
						(v) => v ?? ({ id, _missing: true } as ServiceItem),
					),
				),
			),
			Promise.all(
				activitiesBm.ids.value.map((id) =>
					fetchOne<ActivityDtoById>(
						"/api/activity/byId?id=",
						id,
					).then(
						(v) => v ?? ({ id, _missing: true } as ActivityItem),
					),
				),
			),
		]);
		products.value = p;
		services.value = s;
		activities.value = a;
	} finally {
		loading.value = false;
	}
};

await loadAll();

const removeProduct = (id: string) => {
	productsBm.remove(id);
	products.value = products.value.filter((x) => x.id !== id);
};
const removeService = (id: string) => {
	servicesBm.remove(id);
	services.value = services.value.filter((x) => x.id !== id);
};
const removeActivity = (id: string) => {
	activitiesBm.remove(id);
	activities.value = activities.value.filter((x) => x.id !== id);
};

const formatPrice = (p?: number) =>
	p == null ? "" : new Intl.NumberFormat("ru-RU").format(p);

const formatDate = (iso?: string) => {
	if (!iso) return "";
	try {
		return new Date(iso).toLocaleString("ru-RU", {
			day: "2-digit",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<h1 :class="$style.title">Закладки</h1>

			<div :class="$style.privacyPlate">
				<Icon
					name="material-symbols:shield"
					:class="$style.privacyIcon"
				/>
				<div :class="$style.privacyText">
					<span :class="$style.privacyTitle">Только для вас</span>
					<span :class="$style.privacyHint">
						Закладки хранятся в cookies этого устройства. К ним нет
						доступа ни у администраторов, ни у коменданта — всё, что
						вы здесь сохраняете, видите только вы и только в этом
						браузере.
					</span>
				</div>
			</div>

			<div v-if="loading" :class="$style.empty">Загрузка...</div>

			<template v-else>
				<!-- Товары -->
				<section :class="$style.section">
					<div :class="$style.sectionHead">
						<h2 :class="$style.sectionTitle">Товары</h2>
						<span :class="$style.count">
							{{ products.length }} / 10
						</span>
					</div>
					<div v-if="!products.length" :class="$style.empty">
						Здесь будут сохранённые товары из каталога
					</div>
					<div v-else :class="$style.list">
						<div
							v-for="p in products"
							:key="p.id"
							:class="$style.item"
						>
							<RouterLink
								:to="`/catalog/${p.id}`"
								:class="$style.itemLink"
							>
								<div :class="$style.thumb">
									<img
										v-if="p.images?.[0]?.fileGuid"
										:src="`/api/images/byGuid?guid=${p.images[0].fileGuid}`"
										:class="$style.thumbImg"
									/>
									<Icon
										v-else
										name="mdi:image-outline"
										:class="$style.thumbIcon"
									/>
								</div>
								<div :class="$style.itemInfo">
									<span :class="$style.itemName">
										{{ p._missing ? "Недоступно" : p.name }}
									</span>
									<span
										v-if="!p._missing && p.price != null"
										:class="$style.itemPrice"
									>
										{{ formatPrice(p.price) }}
										<span :class="$style.currency">₽</span>
									</span>
								</div>
							</RouterLink>
							<UiButton
								:class="$style.removeBtn"
								@click="removeProduct(p.id)"
							>
								<Icon
									name="mdi:bookmark-remove-outline"
									:class="$style.removeIcon"
								/>
							</UiButton>
						</div>
					</div>
				</section>

				<!-- Услуги -->
				<section :class="$style.section">
					<div :class="$style.sectionHead">
						<h2 :class="$style.sectionTitle">Услуги</h2>
						<span :class="$style.count">
							{{ services.length }} / 10
						</span>
					</div>
					<div v-if="!services.length" :class="$style.empty">
						Здесь будут сохранённые услуги
					</div>
					<div v-else :class="$style.list">
						<div
							v-for="s in services"
							:key="s.id"
							:class="$style.item"
						>
							<RouterLink
								:to="`/services/${s.id}`"
								:class="$style.itemLink"
							>
								<div :class="$style.thumb">
									<img
										v-if="(s as any).images?.[0]?.fileGuid"
										:src="`/api/images/byGuid?guid=${(s as any).images[0].fileGuid}`"
										:class="$style.thumbImg"
									/>
									<Icon
										v-else
										name="mdi:tools"
										:class="$style.thumbIcon"
									/>
								</div>
								<div :class="$style.itemInfo">
									<span :class="$style.itemName">
										{{
											s._missing
												? "Недоступно"
												: (s as any).name
										}}
									</span>
									<span
										v-if="
											!s._missing &&
											(s as any).price != null
										"
										:class="$style.itemPrice"
									>
										{{ formatPrice((s as any).price) }}
										<span :class="$style.currency">₽</span>
									</span>
								</div>
							</RouterLink>
							<UiButton
								:class="$style.removeBtn"
								@click="removeService(s.id)"
							>
								<Icon
									name="mdi:bookmark-remove-outline"
									:class="$style.removeIcon"
								/>
							</UiButton>
						</div>
					</div>
				</section>

				<!-- Афиша -->
				<section :class="$style.section">
					<div :class="$style.sectionHead">
						<h2 :class="$style.sectionTitle">Афиша</h2>
						<span :class="$style.count">
							{{ activities.length }} / 10
						</span>
					</div>
					<div v-if="!activities.length" :class="$style.empty">
						Здесь будут сохранённые мероприятия
					</div>
					<div v-else :class="$style.list">
						<div
							v-for="a in activities"
							:key="a.id"
							:class="$style.item"
						>
							<RouterLink
								:to="`/activities/${a.id}`"
								:class="$style.itemLink"
							>
								<div :class="$style.thumb">
									<img
										v-if="a.imageIds?.[0]"
										:src="`/api/images/byGuid?guid=${a.imageIds[0]}`"
										:class="$style.thumbImg"
									/>
									<Icon
										v-else
										name="mdi:calendar-star"
										:class="$style.thumbIcon"
									/>
								</div>
								<div :class="$style.itemInfo">
									<span :class="$style.itemName">
										{{
											a._missing ? "Недоступно" : a.title
										}}
									</span>
									<span
										v-if="!a._missing && a.startTime"
										:class="$style.itemMeta"
									>
										{{ formatDate(a.startTime) }}
									</span>
								</div>
							</RouterLink>
							<UiButton
								:class="$style.removeBtn"
								@click="removeActivity(a.id)"
							>
								<Icon
									name="mdi:bookmark-remove-outline"
									:class="$style.removeIcon"
								/>
							</UiButton>
						</div>
					</div>
				</section>
			</template>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	width: 100%;
	padding-bottom: 80px;

	.container {
		@include container;

		display: flex;
		flex-direction: column;
		row-gap: 40px;
		padding-top: 30px;

		@include respond-to(mobile) {
			@include container(mobile);

			row-gap: 24px;
			padding-top: 16px;
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

	.privacyPlate {
		@include color-white-bg(0.72);
		@include shadow;

		display: flex;
		align-items: center;
		column-gap: 16px;
		padding: 16px 18px;
		border-radius: 12px;
		backdrop-filter: blur(12px);

		&::before {
			@include color-success-bg();

			content: "";
			z-index: 1;
			position: absolute;
			left: 0;
			top: 0;
			height: 100%;
			width: 100%;
		}

		@include respond-to(mobile) {
			padding: 12px 14px;
			column-gap: 12px;
		}
	}

	.privacyIcon {
		@include color-accent;

		position: relative;
		width: 48px;
		height: 48px;
		flex-shrink: 0;

		@include respond-to(mobile) {
			width: 40px;
			height: 40px;
		}
	}

	.privacyText {
		display: flex;
		flex-direction: column;
		row-gap: 4px;
	}

	.privacyTitle {
		@include text-m;
		@include color-black;

		font-weight: 600;
	}

	.privacyHint {
		@include text-s;
		@include color-black(0.75);

		line-height: 1.5;
	}

	.section {
		display: flex;
		flex-direction: column;
		row-gap: 14px;
	}

	.sectionHead {
		display: flex;
		align-items: baseline;
		column-gap: 12px;
	}

	.sectionTitle {
		@include reset;
		@include title-s;
		@include color-black;
	}

	.count {
		@include text-s;
		@include color-black(0.5);
	}

	.empty {
		@include text-m;
		@include color-black(0.45);

		text-align: center;
		padding: 24px 16px;
	}

	.list {
		display: flex;
		flex-direction: column;
		row-gap: 8px;
	}

	.item {
		@include color-white-bg(0.72);
		@include shadow;

		display: flex;
		align-items: center;
		column-gap: 12px;
		padding: 10px 14px;
		border-radius: 12px;
		backdrop-filter: blur(12px);
		transition: background-color $transition-fast;

		&:hover {
			@include color-white-bg;
		}
	}

	.itemLink {
		display: flex;
		align-items: center;
		column-gap: 14px;
		text-decoration: none;
		color: inherit;
		flex: 1;
		min-width: 0;
	}

	.thumb {
		width: 56px;
		height: 56px;
		border-radius: 10px;
		background: rgba($color-black-rgb, 0.06);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.thumbImg {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.thumbIcon {
		@include color-black(0.35);

		width: 24px;
		height: 24px;
	}

	.itemInfo {
		display: flex;
		flex-direction: column;
		row-gap: 4px;
		min-width: 0;
	}

	.itemName {
		@include text-m;
		@include color-black;

		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.itemPrice {
		@include text-s;
		@include color-black(0.7);

		.currency {
			font-family: Roboto;
			font-weight: 300;
		}
	}

	.itemMeta {
		@include text-s;
		@include color-black(0.55);
	}

	.removeBtn {
		flex-shrink: 0;
	}

	.removeIcon {
		@include color-black;

		width: 18px;
		height: 18px;
	}
}
</style>
