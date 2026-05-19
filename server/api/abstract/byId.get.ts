import { decodeAccessToken } from "~~/server/utils/staticfiles";
import { readAbstract } from "~~/server/utils/abstracts";
import type { AbstractDtoById } from "~~/server/dto/abstract/byId";

const FILENAME = "abstract/byId.get.ts";

export default defineEventHandler(async (event): Promise<AbstractDtoById> => {
	try {
		const cookie = getHeader(event, "cookie");
		const payload = decodeAccessToken(cookie);
		const userId: string | undefined = payload?.sub;

		const query = getQuery(event);
		const id = String(query.id ?? "");
		if (!id) {
			throw createError({ statusCode: 400, message: "id is required" });
		}

		const a = readAbstract(id);
		if (!a) {
			throw createError({ statusCode: 404, message: "Конспект не найден" });
		}

		return {
			id: a.id,
			type: a.type,
			title: a.title,
			subject: a.subject,
			description: a.description,
			imageIds: a.imageIds,
			authorId: a.authorId,
			likeCount: a.likes.length,
			userLiked: userId ? a.likes.includes(userId) : false,
			createdAt: a.createdAt,
			updatedAt: a.updatedAt,
		};
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to read abstract" });
	}
});
