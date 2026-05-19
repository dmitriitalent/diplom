import { decodeAccessToken } from "~~/server/utils/staticfiles";
import { readAbstract, writeAbstract } from "~~/server/utils/abstracts";

const FILENAME = "abstract/like.put.ts";

type LikeResponse = {
	id: string;
	likeCount: number;
	userLiked: boolean;
};

export default defineEventHandler(async (event): Promise<LikeResponse> => {
	try {
		const cookie = getHeader(event, "cookie");
		const payload = decodeAccessToken(cookie);
		const userId: string | undefined = payload?.sub;
		if (!userId) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const query = getQuery(event);
		const id = String(query.id ?? "");
		if (!id) {
			throw createError({ statusCode: 400, message: "id is required" });
		}

		const a = readAbstract(id);
		if (!a) {
			throw createError({ statusCode: 404, message: "Конспект не найден" });
		}

		const idx = a.likes.indexOf(userId);
		if (idx === -1) {
			a.likes.push(userId);
		} else {
			a.likes.splice(idx, 1);
		}
		a.updatedAt = new Date().toISOString();
		writeAbstract(id, a);

		return {
			id: a.id,
			likeCount: a.likes.length,
			userLiked: a.likes.includes(userId),
		};
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to like" });
	}
});
