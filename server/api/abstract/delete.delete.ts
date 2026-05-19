import { decodeAccessToken } from "~~/server/utils/staticfiles";
import {
	readAbstract,
	deleteAbstractFile,
} from "~~/server/utils/abstracts";

const FILENAME = "abstract/delete.delete.ts";

function isAdmin(cookie: string | undefined): boolean {
	const payload = decodeAccessToken(cookie);
	return (
		Array.isArray(payload?.roles) &&
		(payload!.roles.includes("ADMIN") ||
			payload!.roles.includes("COMMANDANT"))
	);
}

export default defineEventHandler(async (event) => {
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

		deleteAbstractFile(id);
		return { id, deleted: true };
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to delete" });
	}
});
