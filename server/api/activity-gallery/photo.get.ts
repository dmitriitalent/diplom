import fs from "node:fs";
import path from "node:path";
import { findPhotoFile } from "~~/server/utils/activityGallery";
import { mimeByExt } from "~~/server/utils/staticfiles";

const FILENAME = "activity-gallery/photo.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const query = getQuery(event);
		const activityId = String(query.activityId ?? "");
		const photoId = String(query.photoId ?? "");
		if (!activityId || !photoId) {
			throw createError({
				statusCode: 400,
				message: "activityId and photoId required",
			});
		}
		const fp = findPhotoFile(activityId, photoId);
		if (!fp) {
			throw createError({ statusCode: 404, message: "Photo not found" });
		}
		const ext = path.extname(fp);
		setHeader(event, "content-type", mimeByExt(ext));
		setHeader(event, "cache-control", "public, max-age=604800");
		return fs.readFileSync(fp);
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500 });
	}
});
