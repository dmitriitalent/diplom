import { decodeAccessToken } from "~~/server/utils/staticfiles";
import { readIndex, removePhoto } from "~~/server/utils/activityGallery";
import { canEditActivityGallery } from "~~/server/utils/activityAccess";

const FILENAME = "activity-gallery/photo.delete.ts";

export default defineEventHandler(async (event) => {
	try {
		const cookie = getHeader(event, "cookie");
		const payload = decodeAccessToken(cookie);
		const userId: string | undefined = payload?.sub;
		if (!userId) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const query = getQuery(event);
		const activityId = String(query.activityId ?? "");
		const photoId = String(query.photoId ?? "");
		if (!activityId || !photoId) {
			throw createError({
				statusCode: 400,
				message: "activityId and photoId required",
			});
		}

		const idx = readIndex(activityId);
		const photo = idx.photos.find((p) => p.id === photoId);
		if (!photo) {
			throw createError({ statusCode: 404, message: "Photo not found" });
		}

		const isUploader = photo.uploadedBy === userId;
		const canEdit = isUploader
			? true
			: await canEditActivityGallery(activityId, userId, cookie);
		if (!isUploader && !canEdit) {
			throw createError({ statusCode: 403, message: "Forbidden" });
		}

		removePhoto(activityId, photoId);
		return { deleted: true };
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to delete" });
	}
});
