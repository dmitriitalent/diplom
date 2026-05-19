import { decodeAccessToken } from "~~/server/utils/staticfiles";
import {
	readAbstract,
	writeAbstract,
	type AbstractFile,
} from "~~/server/utils/abstracts";
import type { AbstractDtoCreate } from "~~/server/dto/abstract/create";

const FILENAME = "abstract/edit.put.ts";

function isAdmin(cookie: string | undefined): boolean {
	const payload = decodeAccessToken(cookie);
	return (
		Array.isArray(payload?.roles) &&
		(payload!.roles.includes("ADMIN") ||
			payload!.roles.includes("COMMANDANT"))
	);
}

export default defineEventHandler(async (event): Promise<AbstractFile> => {
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

		const existing = readAbstract(id);
		if (!existing) {
			throw createError({ statusCode: 404, message: "Конспект не найден" });
		}
		if (existing.authorId !== userId && !isAdmin(cookie)) {
			throw createError({ statusCode: 403, message: "Forbidden" });
		}

		const body = (await readBody<AbstractDtoCreate>(event)) ?? ({} as AbstractDtoCreate);
		const updated: AbstractFile = {
			...existing,
			type: body.type === "lab" ? "lab" : "lecture",
			title: (body.title ?? "").trim() || existing.title,
			subject: (body.subject ?? "").trim() || existing.subject,
			description: (body.description ?? "").trim(),
			imageIds: Array.isArray(body.imageIds) ? body.imageIds : existing.imageIds,
			updatedAt: new Date().toISOString(),
		};
		writeAbstract(id, updated);
		return updated;
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to edit abstract" });
	}
});
