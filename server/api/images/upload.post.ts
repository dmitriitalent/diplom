import axios from "axios";
import sharp from "sharp";

const FILENAME = "images/upload.post.ts";

// ─── Параметры сжатия ──────────────────────────────────────────
// Сжимать всё, что больше этого размера (байт). Итог гарантированно меньше TARGET_MAX_BYTES.
const COMPRESSION_THRESHOLD = 1 * 1024 * 1024; // 1 MB
// Целевой максимум для бэкенда. Если после сжатия больше — снижаем качество ещё.
const TARGET_MAX_BYTES = 4 * 1024 * 1024; // 4 MB
// Максимальные размеры после сжатия
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
// Стартовое качество и шаг снижения
const START_QUALITY = 80;
const MIN_QUALITY = 35;
const QUALITY_STEP = 10;
// ──────────────────────────────────────────────────────────────

type CompressedResult = {
	buffer: Buffer;
	mimeType: string;
	filename: string;
};

const compressImage = async (
	input: Buffer,
	originalMime: string,
	originalName: string,
): Promise<CompressedResult> => {
	const base = originalName.replace(/\.[^/.]+$/, "") || "image";

	// PNG c прозрачностью лучше держать в PNG, иначе уйдёт в JPEG (без альфы).
	const meta = await sharp(input, { failOn: "none" }).metadata();
	const hasAlpha = !!meta.hasAlpha;
	const keepPng = originalMime === "image/png" && hasAlpha;

	const needsResize =
		(meta.width ?? 0) > MAX_WIDTH || (meta.height ?? 0) > MAX_HEIGHT;

	const buildPipeline = (quality: number) => {
		let p = sharp(input, { failOn: "none" }).rotate();
		if (needsResize) {
			p = p.resize({
				width: MAX_WIDTH,
				height: MAX_HEIGHT,
				fit: "inside",
				withoutEnlargement: true,
			});
		}
		if (keepPng) {
			p = p.png({ compressionLevel: 9, palette: true });
		} else if (originalMime === "image/webp") {
			p = p.webp({ quality });
		} else {
			p = p.jpeg({ quality, mozjpeg: true });
		}
		return p;
	};

	// Итеративно снижаем качество, пока не уложимся в TARGET_MAX_BYTES
	let quality = START_QUALITY;
	let buffer = await buildPipeline(quality).toBuffer();
	while (buffer.length > TARGET_MAX_BYTES && quality > MIN_QUALITY && !keepPng) {
		quality -= QUALITY_STEP;
		buffer = await buildPipeline(quality).toBuffer();
	}

	const mime = keepPng
		? "image/png"
		: originalMime === "image/webp"
			? "image/webp"
			: "image/jpeg";
	const ext = keepPng ? "png" : originalMime === "image/webp" ? "webp" : "jpg";

	return { buffer, mimeType: mime, filename: `${base}.${ext}` };
};

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();

		const form = await readMultipartFormData(event);

		if (!form || form.length === 0) {
			throw createError({
				message: "No file uploaded",
			});
		}

		let fileItem: any = null;
		let externalId: string | null = null;

		for (const item of form) {
			if (item.name === "file") {
				fileItem = item;
			}

			if (item.name === "external_id") {
				externalId = item.data.toString();
			}
		}

		if (!fileItem) {
			throw createError({
				message: "File not found",
			});
		}

		if (!externalId) {
			throw createError({
				message: "external_id is required",
			});
		}

		// ─── Сжатие, если файл слишком большой и это изображение ───
		let fileData: Buffer = fileItem.data;
		let fileType: string = fileItem.type ?? "application/octet-stream";
		let fileName: string = fileItem.filename ?? "image";

		const isImage = fileType.startsWith("image/");
		if (isImage && fileData.length > COMPRESSION_THRESHOLD) {
			try {
				const compressed = await compressImage(fileData, fileType, fileName);
				console.log(
					`[${FILENAME}] compressed ${fileData.length} → ${compressed.buffer.length} bytes (${fileName})`,
				);
				fileData = compressed.buffer;
				fileType = compressed.mimeType;
				fileName = compressed.filename;
			} catch (compErr) {
				console.log(`[${FILENAME}] compression failed, sending original`, compErr);
			}
		}

		const formData = new FormData();
		const blob = new Blob([fileData], { type: fileType });
		formData.append("file", blob, fileName);
		formData.append("external_id", externalId);

		const cookie = getHeader(event, "cookie");
		const url = `${config.api}/images`;

		const res = await axios.post(url, formData, {
			headers: {
				cookie,
			},
			withCredentials: true,
		});

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);

		if (err.message === "No file uploaded") {
			throw createError({
				statusCode: 1400,
				message: "No file uploaded",
			});
		}

		if (err.message === "File not found") {
			throw createError({
				statusCode: 1400,
				message: "File not found",
			});
		}

		if (err.message === "external_id is required") {
			throw createError({
				statusCode: 1400,
				message: "external_id is required",
			});
		}

		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message || err.message,
		});
	}
});
