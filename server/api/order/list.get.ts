import {
	listOrderIds,
	readOrder,
	type OrderFile,
} from "~~/server/utils/orders";
import type { OrderListDto } from "~~/server/dto/order/list";

const FILENAME = "order/list.get.ts";

export default defineEventHandler(async (): Promise<OrderListDto> => {
	try {
		const ids = listOrderIds();
		const items: OrderFile[] = [];
		for (const id of ids) {
			const o = readOrder(id);
			if (o) items.push(o);
		}
		items.sort((a, b) => Number(b.id) - Number(a.id));
		return { items };
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		throw createError({ statusCode: 500, message: "Failed to list orders" });
	}
});
