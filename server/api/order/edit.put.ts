import {
	readOrder,
	writeOrder,
	getUserId,
	isCommandant,
	type OrderFile,
} from "~~/server/utils/orders";
import type { OrderDtoCreate } from "~~/server/dto/order/create";

const FILENAME = "order/edit.put.ts";

export default defineEventHandler(async (event): Promise<OrderFile> => {
	try {
		const cookie = getHeader(event, "cookie");
		const userId = getUserId(cookie);
		if (!userId) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const query = getQuery(event);
		const id = String(query.id ?? "");
		if (!id) {
			throw createError({ statusCode: 400, message: "id is required" });
		}

		const existing = readOrder(id);
		if (!existing) {
			throw createError({ statusCode: 404, message: "Order not found" });
		}

		if (existing.authorId !== userId && !isCommandant(cookie)) {
			throw createError({ statusCode: 403, message: "Forbidden" });
		}

		const body = (await readBody(event)) as OrderDtoCreate;
		if (!body?.type || typeof body.type !== "string") {
			throw createError({ statusCode: 400, message: "type is required" });
		}

		const updated: OrderFile = {
			...existing,
			type: body.type,
			description: body.description ?? "",
			imageIds: Array.isArray(body.imageIds) ? body.imageIds : [],
			updatedAt: new Date().toISOString(),
		};

		writeOrder(id, updated);
		return updated;
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		if (err.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to edit order" });
	}
});
