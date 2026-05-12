import fs from "node:fs";
import path from "node:path";

const FILENAME = "staticfiles/[key].put.ts";

/** PUT /api/staticfiles/:key — загружает/заменяет файл по ключу (только ADMIN) */
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

		// Валидация ключа: только буквы, цифры и дефис
		if (!/^[a-z0-9-]+$/i.test(key)) {
			throw createError({ statusCode: 400, message: "Invalid key format" });
		}

		const form = await readMultipartFormData(event);
		if (!form || form.length === 0) {
			throw createError({ statusCode: 400, message: "No file uploaded" });
		}

		const fileItem = form.find((f) => f.name === "file");
		if (!fileItem) {
			throw createError({ statusCode: 400, message: "Field 'file' is required" });
		}

		const mime = fileItem.type ?? "application/octet-stream";
		const ext = extByMime(mime);

		ensureStaticfilesDir();

		// Удаляем предыдущие файлы с тем же ключом (если были)
		deleteFilesByKey(key);

		const destPath = path.join(STATICFILES_DIR, `${key}${ext}`);
		fs.writeFileSync(destPath, fileItem.data);

		return {
			key,
			url: `/api/staticfiles/${key}`,
			size: fileItem.data.length,
		};
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		if (err.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to save static file" });
	}
});
