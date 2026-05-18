import sharp from "sharp";

// ─── Параметры сжатия ──────────────────────────────────────────
/** Сжимать всё, что больше этого размера (байт). */
export const COMPRESSION_THRESHOLD = 1 * 1024 * 1024; // 1 MB
/** Целевой максимум для бэкенда. */
export const TARGET_MAX_BYTES = 4 * 1024 * 1024; // 4 MB
/** Максимальные размеры после сжатия. */
export const MAX_WIDTH = 1920;
export const MAX_HEIGHT = 1080;
/** Стартовое качество и шаг снижения. */
export const START_QUALITY = 80;
export const MIN_QUALITY = 35;
export const QUALITY_STEP = 10;
// ──────────────────────────────────────────────────────────────

export type CompressedResult = {
	buffer: Buffer;
	mimeType: string;
	filename: string;
	extension: string;
};

/**
 * Сжимает изображение до TARGET_MAX_BYTES, итеративно снижая качество
 * от START_QUALITY до MIN_QUALITY. PNG с прозрачностью остаётся PNG.
 */
export const compressImage = async (
	input: Buffer,
	originalMime: string,
	originalName = "image",
): Promise<CompressedResult> => {
	const base = originalName.replace(/\.[^/.]+$/, "") || "image";

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

	let quality = START_QUALITY;
	let buffer = await buildPipeline(quality).toBuffer();
	while (
		buffer.length > TARGET_MAX_BYTES &&
		quality > MIN_QUALITY &&
		!keepPng
	) {
		quality -= QUALITY_STEP;
		buffer = await buildPipeline(quality).toBuffer();
	}

	const mimeType = keepPng
		? "image/png"
		: originalMime === "image/webp"
			? "image/webp"
			: "image/jpeg";
	const extension = keepPng
		? "png"
		: originalMime === "image/webp"
			? "webp"
			: "jpg";

	return { buffer, mimeType, filename: `${base}.${extension}`, extension };
};

/**
 * Сжимает изображение только если оно больше COMPRESSION_THRESHOLD
 * и это действительно картинка. Иначе возвращает исходные данные.
 * Безопасна для любых файлов — поглощает ошибки sharp.
 */
export const maybeCompressImage = async (
	data: Buffer,
	mime: string,
	filename = "image",
): Promise<CompressedResult> => {
	const isImage = mime.startsWith("image/");
	const shouldCompress = isImage && data.length > COMPRESSION_THRESHOLD;

	if (!shouldCompress) {
		return {
			buffer: data,
			mimeType: mime,
			filename,
			extension: filename.split(".").pop() ?? "bin",
		};
	}

	try {
		return await compressImage(data, mime, filename);
	} catch (err) {
		console.log("[imageCompression] failed, returning original:", err);
		return {
			buffer: data,
			mimeType: mime,
			filename,
			extension: filename.split(".").pop() ?? "bin",
		};
	}
};
