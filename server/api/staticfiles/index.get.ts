import fs from "node:fs";
import path from "node:path";

const FILENAME = "staticfiles/index.get.ts";

/** GET /api/staticfiles — возвращает список всех ключей с их URL */
export default defineEventHandler(async () => {
	try {
		ensureStaticfilesDir();

		const files = fs.readdirSync(STATICFILES_DIR);
		const items = files.map((f) => {
			const ext = path.extname(f);
			const key = f.slice(0, f.length - ext.length);
			return { key, url: `/api/staticfiles/${key}` };
		});

		return items;
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		throw createError({ statusCode: 500, message: "Failed to list static files" });
	}
});
