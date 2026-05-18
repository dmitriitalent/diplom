import { readOrder } from "~~/server/utils/orders";
import type { OrderDtoById } from "~~/server/dto/order/byId";

const FILENAME = "order/byId.get.ts";

export default defineEventHandler(async (event): Promise<OrderDtoById> => {
	try {
		const query = getQuery(event);
		const id = String(query.id ?? "");
		if (!id) {
			throw createError({ statusCode: 400, message: "id is required" });
		}

		const order = readOrder(id);
		if (!order) {
			throw createError({ statusCode: 404, message: "Order not found" });
		}
		return order;
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		if (err.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to read order" });
	}
});
