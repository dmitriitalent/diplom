import {
	nextOrderId,
	writeOrder,
	getUserId,
	type OrderFile,
} from "~~/server/utils/orders";
import type { OrderDtoCreate } from "~~/server/dto/order/create";

const FILENAME = "order/create.post.ts";

export default defineEventHandler(async (event): Promise<OrderFile> => {
	try {
		const cookie = getHeader(event, "cookie");
		const authorId = getUserId(cookie);
		if (!authorId) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const body = (await readBody(event)) as OrderDtoCreate;
		if (!body?.type || typeof body.type !== "string") {
			throw createError({ statusCode: 400, message: "type is required" });
		}

		const id = nextOrderId();
		const now = new Date().toISOString();

		const order: OrderFile = {
			id: String(id),
			type: body.type,
			description: body.description ?? "",
			imageIds: Array.isArray(body.imageIds) ? body.imageIds : [],
			authorId,
			createdAt: now,
			updatedAt: now,
			closedAt: null,
			closeType: null,
			closeComment: "",
			status: "open",
		};

		writeOrder(id, order);
		return order;
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		if (err.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to create order" });
	}
});
