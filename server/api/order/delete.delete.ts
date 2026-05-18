import {
	readOrder,
	deleteOrderFile,
	getUserId,
	isCommandant,
} from "~~/server/utils/orders";

const FILENAME = "order/delete.delete.ts";

export default defineEventHandler(async (event) => {
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

		deleteOrderFile(id);
		return { id, deleted: true };
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		if (err.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to delete order" });
	}
});
