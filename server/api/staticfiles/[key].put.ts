import fs from "node:fs";
import path from "node:path";
import { maybeCompressImage } from "~~/server/utils/imageCompression";

const FILENAME = "staticfiles/[key].put.ts";

// PUT /api/staticfiles/:key — загружает/заменяет файл по ключу (только ADMIN)
export default defineEventHandler(async (event) => {
	try {
		const cookie = getHeader(event, "cookie");

		if (!isAdmin(cookie)) {
			throw createError({
				statusCode: 403,
				message: "Forbidden: ADMIN role required",
			});
		}

		const key = getRouterParam(event, "key");
		if (!key) {
			throw createError({ statusCode: 400, message: "key is required" });
		}

		// Валидация ключа: только буквы, цифры и дефис
		if (!/^[a-z0-9-]+$/i.test(key)) {
			throw createError({
				statusCode: 400,
				message: "Invalid key format",
			});
		}

		const form = await readMultipartFormData(event);
		if (!form || form.length === 0) {
			throw createError({ statusCode: 400, message: "No file uploaded" });
		}

		const fileItem = form.find((f) => f.name === "file");
		if (!fileItem) {
			throw createError({
				statusCode: 400,
				message: "Field 'file' is required",
			});
		}

		const originalMime = fileItem.type ?? "application/octet-stream";
		const originalSize = fileItem.data.length;

		// ─── Сжатие изображений (если применимо) ──────────────────────
		const compressed = await maybeCompressImage(
			fileItem.data,
			originalMime,
			fileItem.filename ?? key,
		);

		if (compressed.buffer.length !== originalSize) {
			console.log(
				`[${FILENAME}] compressed ${originalSize} → ${compressed.buffer.length} bytes (${key})`,
			);
		}

		const ext = extByMime(compressed.mimeType);

		ensureStaticfilesDir();

		// Удаляем предыдущие файлы с тем же ключом (если были)
		deleteFilesByKey(key);

		const destPath = path.join(STATICFILES_DIR, `${key}${ext}`);
		fs.writeFileSync(destPath, compressed.buffer);

		return {
			key,
			url: `/api/staticfiles/${key}`,
			size: compressed.buffer.length,
		};
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		if (err.statusCode) throw err;
		throw createError({
			statusCode: 500,
			message: "Failed to save static file",
		});
	}
});
