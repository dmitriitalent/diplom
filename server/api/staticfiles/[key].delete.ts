const FILENAME = "staticfiles/[key].delete.ts";

/** DELETE /api/staticfiles/:key — удаляет файл по ключу (только ADMIN) */
export default defineEventHandler(async (event) => {
	try {
		const cookie = getHeader(event, "cookie");

		if (!isAdmin(cookie)) {
			throw createError({ statusCode: 403, message: "Forbidden: ADMIN role required" });
		}

		const key = getRouterParam(event, "key");
		if (!key) {
			throw createError({ statusCode: 400, message: "key is required" });
		}

		const existing = findFileByKey(key);
		if (!existing) {
			throw createError({ statusCode: 404, message: `Static file '${key}' not found` });
		}

		deleteFilesByKey(key);

		return { key, deleted: true };
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		if (err.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to delete static file" });
	}
});
