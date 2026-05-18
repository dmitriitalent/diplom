import axios from "axios";
import { maybeCompressImage } from "~~/server/utils/imageCompression";

const FILENAME = "images/upload.post.ts";

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

		// ─── Сжатие через общий util ──────────────────────────────────
		const originalSize = fileItem.data.length;
		const compressed = await maybeCompressImage(
			fileItem.data,
			fileItem.type ?? "application/octet-stream",
			fileItem.filename ?? "image",
		);

		if (compressed.buffer.length !== originalSize) {
			console.log(
				`[${FILENAME}] compressed ${originalSize} → ${compressed.buffer.length} bytes (${compressed.filename})`,
			);
		}

		const formData = new FormData();
		const blob = new Blob([compressed.buffer], { type: compressed.mimeType });
		formData.append("file", blob, compressed.filename);
		formData.append("external_id", externalId);

		const cookie = getHeader(event, "cookie");
		const url = `${config.api}/images`;

		const fmt = (b: number) =>
			`${b} B (${(b / 1024).toFixed(1)} KB / ${(b / 1024 / 1024).toFixed(2)} MB)`;
		console.log(
			`[${FILENAME}] → POST ${url} | file=${compressed.filename} type=${compressed.mimeType} size=${fmt(compressed.buffer.length)}`,
		);

		const res = await axios.post(url, formData, {
			headers: {
				cookie,
			},
			withCredentials: true,
			maxContentLength: Infinity,
			maxBodyLength: Infinity,
		});

		console.log(
			`[${FILENAME}] ← ${res.status} from backend (uploaded ${fmt(compressed.buffer.length)})`,
		);

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
