import axios from "axios";
import sharp from "sharp";

const FILENAME = "images/upload.post.ts";

// ─── Параметры сжатия ──────────────────────────────────────────
// Сжимать, если исходный файл больше этого размера (байт)
const COMPRESSION_THRESHOLD = 10 * 1024 * 1024; // 10 MB
// Максимальные размеры после сжатия
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
// Качество JPEG/WebP (0–100)
const JPEG_QUALITY = 80;
const WEBP_QUALITY = 80;
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
	const image = sharp(input, { failOn: "none" });
	const meta = await image.metadata();

	const needsResize =
		(meta.width ?? 0) > MAX_WIDTH || (meta.height ?? 0) > MAX_HEIGHT;

	let pipeline = image.rotate(); // авто-поворот по EXIF
	if (needsResize) {
		pipeline = pipeline.resize({
			width: MAX_WIDTH,
			height: MAX_HEIGHT,
			fit: "inside",
			withoutEnlargement: true,
		});
	}

	// Формат: png остаётся png (lossless через level), всё остальное → jpeg
	let mime = originalMime;
	let ext = (originalName.split(".").pop() ?? "").toLowerCase();

	if (originalMime === "image/png") {
		pipeline = pipeline.png({ compressionLevel: 9, palette: true });
	} else if (originalMime === "image/webp") {
		pipeline = pipeline.webp({ quality: WEBP_QUALITY });
	} else {
		pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
		mime = "image/jpeg";
		ext = "jpg";
	}

	const buffer = await pipeline.toBuffer();

	const base = originalName.replace(/\.[^/.]+$/, "") || "image";
	const filename = `${base}.${ext}`;

	return { buffer, mimeType: mime, filename };
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
