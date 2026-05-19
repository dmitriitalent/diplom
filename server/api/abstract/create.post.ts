import { decodeAccessToken } from "~~/server/utils/staticfiles";
import {
	nextAbstractId,
	writeAbstract,
	type AbstractFile,
} from "~~/server/utils/abstracts";
import type { AbstractDtoCreate } from "~~/server/dto/abstract/create";

const FILENAME = "abstract/create.post.ts";

export default defineEventHandler(async (event): Promise<AbstractFile> => {
	try {
		const cookie = getHeader(event, "cookie");
		const payload = decodeAccessToken(cookie);
		const userId: string | undefined = payload?.sub;
		if (!userId) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const body = (await readBody<AbstractDtoCreate>(event)) ?? ({} as AbstractDtoCreate);
		const type: "lecture" | "lab" =
			body.type === "lab" ? "lab" : "lecture";
		const title = (body.title ?? "").trim();
		const subject = (body.subject ?? "").trim();
		const description = (body.description ?? "").trim();
		const imageIds = Array.isArray(body.imageIds) ? body.imageIds : [];

		if (!title) {
			throw createError({ statusCode: 400, message: "Название обязательно" });
		}
		if (!subject) {
			throw createError({ statusCode: 400, message: "Предмет обязателен" });
		}

		const id = nextAbstractId();
		const now = new Date().toISOString();
		const data: AbstractFile = {
			id: String(id),
			type,
			title,
			subject,
			description,
			imageIds,
			authorId: userId,
			likes: [],
			createdAt: now,
			updatedAt: now,
		};
		writeAbstract(id, data);
		return data;
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to create abstract" });
	}
});
