import fs from "node:fs";
import path from "node:path";

const FILENAME = "staticfiles/[key].get.ts";

/** GET /api/staticfiles/:key — отдаёт файл по ключу */
export default defineEventHandler(async (event) => {
	try {
		const key = getRouterParam(event, "key");
		if (!key) {
			throw createError({ statusCode: 400, message: "key is required" });
		}

		const filePath = findFileByKey(key);
		if (!filePath) {
			throw createError({ statusCode: 404, message: `Static file '${key}' not found` });
		}

		const ext = path.extname(filePath);
		const mime = mimeByExt(ext);

		setHeader(event, "content-type", mime);
		setHeader(event, "cache-control", "public, max-age=86400");

		return fs.readFileSync(filePath);
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		if (err.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to serve static file" });
	}
});
