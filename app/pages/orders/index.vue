<script setup lang="ts">
definePageMeta({ middleware: "verified" });

useSeoMeta({
	title: "Заявки",
	description: "Заявки в комендатуру общежития Hostelite.",
});

import type { Order } from "~/entities/Order";
import type { byId } from "~~/server/dto/profile/byId";
import type { OrderListDto } from "~~/server/dto/order/list";
import { useAuthStore } from "~/stores/authStore";
import { useDevice } from "~/composables/device";

const headers = useRequestHeaders(["cookie"]);

const { deviceClassList } = useDevice();

const auth = useAuthStore();
const isCommandant = auth.isCommandant;

const orders = ref<Array<Order>>([]);

const mapOrder = async (
	f: OrderListDto["items"][number],
): Promise<Order> => {
	let author;
	try {
		const authorFetch = await $fetch<byId>(
			"/api/profile/byId?id=" + f.authorId,
			{ headers },
		);
		author = unwrapProfile(authorFetch);
	} catch {
		author = undefined;
	}
	return {
		id: f.id,
		type: f.type,
		description: f.description,
		imageIds: f.imageIds,
		authorId: f.authorId,
		author,
		createdAt: f.createdAt,
		updatedAt: f.updatedAt,
		closedAt: f.closedAt,
		closeType: f.closeType,
		closeComment: f.closeComment,
		status: f.status,
	};
};

const res = await $fetch<OrderListDto>("/api/order/list", { headers });
for (const f of res?.items ?? []) {
	orders.value.push(await mapOrder(f));
}

const openOrders = computed(() =>
	orders.value.filter((o) => o.status === "open"),
);
const closedOrders = computed(() =>
	orders.value.filter((o) => o.status === "closed"),
);

const formatDateTime = (iso: string | null | undefined) => {
	if (!iso) return "";
	const d = new Date(iso);
	return d.toLocaleString("ru-RU", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const statusLabel = (o: Order) => {
	if (o.status === "open") return "Открыта";
	if (o.closeType === "completed") return "Выполнена";
	if (o.closeType === "declined") return "Отклонена";
	return "Закрыта";
};

const printList = () => {
	if (import.meta.client) window.print();
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<div :class="$style.actions">
				<RouterLink to="/orders/create">
					<UiButton accent>Создать заявку</UiButton>
				</RouterLink>
				<UiButton v-if="isCommandant" inset @click="printList">
					<Icon
						name="material-symbols:print-outline-rounded"
						:class="$style.printIcon"
					/>
					Печать журнала
				</UiButton>
			</div>

			<template v-if="openOrders.length > 0">
				<h2 :class="$style.sectionTitle">Открытые</h2>
				<OrderPlateComponent
					v-for="order in openOrders"
					:key="order.id"
					:order="order"
				/>
			</template>

			<template v-if="closedOrders.length > 0">
				<h2 :class="$style.sectionTitle">Закрытые</h2>
				<OrderPlateComponent
					v-for="order in closedOrders"
					:key="order.id"
					:order="order"
				/>
			</template>

			<template v-if="orders.length === 0">
				<p :class="$style.empty">Заявок пока нет</p>
			</template>
		</div>

		<div v-if="isCommandant" :class="$style.printSheet">
			<h1 :class="$style.printTitle">Журнал заявок</h1>
			<p :class="$style.printSubtitle">
				Дата печати: {{ formatDateTime(new Date().toISOString()) }}
			</p>
			<table :class="$style.printTable">
				<thead>
					<tr>
						<th>№</th>
						<th>Тип</th>
						<th>Описание</th>
						<th>Заявитель</th>
						<th>Создана</th>
						<th>Обновлена</th>
						<th>Закрыта</th>
						<th>Статус</th>
						<th>Причина закрытия</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="o in orders" :key="o.id">
						<td>{{ o.id }}</td>
						<td>{{ o.type }}</td>
						<td>{{ o.description }}</td>
						<td>
							{{ o.author?.surname }} {{ o.author?.name }}
							{{ o.author?.patronymic }}
							<template v-if="o.author?.room">
								(к. {{ o.author.room }})
							</template>
						</td>
						<td>{{ formatDateTime(o.createdAt) }}</td>
						<td>{{ formatDateTime(o.updatedAt) }}</td>
						<td>{{ formatDateTime(o.closedAt) }}</td>
						<td>{{ statusLabel(o) }}</td>
						<td>{{ o.closeComment }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;

		display: flex;
		flex-direction: column;
		row-gap: 30px;

		@include respond-to(mobile) {
			@include container(mobile);

			row-gap: 20px;
		}

		.actions {
			display: flex;
			column-gap: 12px;
			flex-wrap: wrap;

			.printIcon {
				width: 20px;
				height: 20px;
				margin-right: 6px;
			}
		}

		.sectionTitle {
			@include reset;
			@include title-m;
			@include color-black;

			opacity: 0.5;
		}

		.empty {
			@include text-m;
			@include color-black;

			opacity: 0.5;
			text-align: center;
		}
	}

	.printSheet {
		display: none;
	}
}

@media print {
	.wrapper {
		.container {
			display: none !important;
		}

		.printSheet {
			display: block;
			padding: 20px;
			color: #000;
			background: #fff;

			.printTitle {
				font-size: 22px;
				margin: 0 0 4px;
			}

			.printSubtitle {
				font-size: 12px;
				margin: 0 0 16px;
				opacity: 0.7;
			}

			.printTable {
				width: 100%;
				border-collapse: collapse;
				font-size: 11px;

				th,
				td {
					border: 1px solid #333;
					padding: 4px 6px;
					vertical-align: top;
					text-align: left;
				}

				thead {
					th {
						background: #eee;
						font-weight: 600;
					}
				}
			}
		}
	}
}
</style>
