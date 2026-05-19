import { decodeAccessToken } from "~~/server/utils/staticfiles";
import { canEditActivityGallery } from "~~/server/utils/activityAccess";
import { savePhoto } from "~~/server/utils/activityGallery";
import type { GalleryItemDto } from "~~/server/dto/activityGallery/list";

const FILENAME = "activity-gallery/upload.post.ts";

export default defineEventHandler(async (event): Promise<GalleryItemDto> => {
	try {
		const cookie = getHeader(event, "cookie");
		const payload = decodeAccessToken(cookie);
		const userId: string | undefined = payload?.sub;
		if (!userId) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const query = getQuery(event);
		const activityId = String(query.id ?? "");
		if (!activityId) {
			throw createError({ statusCode: 400, message: "id is required" });
		}

		const allowed = await canEditActivityGallery(
			activityId,
			userId,
			cookie,
		);
		if (!allowed) {
			throw createError({
				statusCode: 403,
				message: "Только участники активности могут добавлять фото",
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
		const mime = fileItem.type ?? "application/octet-stream";
		if (!mime.startsWith("image/")) {
			throw createError({
				statusCode: 400,
				message: "Только изображения",
			});
		}

		const photo = await savePhoto(
			activityId,
			userId,
			fileItem.data,
			mime,
			fileItem.filename ?? "image",
		);

		return {
			id: photo.id,
			url: `/api/activity-gallery/photo?activityId=${encodeURIComponent(
				activityId,
			)}&photoId=${encodeURIComponent(photo.id)}`,
			width: photo.width,
			height: photo.height,
			uploadedBy: photo.uploadedBy,
			uploadedAt: photo.uploadedAt,
		};
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to upload" });
	}
});
