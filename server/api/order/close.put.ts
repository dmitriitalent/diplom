import {
	readOrder,
	writeOrder,
	isCommandant,
	type OrderFile,
} from "~~/server/utils/orders";
import type { OrderDtoClose } from "~~/server/dto/order/close";

const FILENAME = "order/close.put.ts";

export default defineEventHandler(async (event): Promise<OrderFile> => {
	try {
		const cookie = getHeader(event, "cookie");
		if (!isCommandant(cookie)) {
			throw createError({
				statusCode: 403,
				message: "Forbidden: COMMANDANT role required",
			});
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

		const body = (await readBody(event)) as OrderDtoClose;
		if (body.closeType !== "completed" && body.closeType !== "declined") {
			throw createError({ statusCode: 400, message: "Invalid closeType" });
		}
		if (body.closeType === "declined" && !body.closeComment?.trim()) {
			throw createError({
				statusCode: 400,
				message: "Comment is required for declined orders",
			});
		}

		const now = new Date().toISOString();
		const updated: OrderFile = {
			...existing,
			status: "closed",
			closeType: body.closeType,
			closeComment: body.closeComment ?? "",
			closedAt: now,
			updatedAt: now,
		};

		writeOrder(id, updated);
		return updated;
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		if (err.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to close order" });
	}
});
