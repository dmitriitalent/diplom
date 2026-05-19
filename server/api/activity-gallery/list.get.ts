import { readIndex } from "~~/server/utils/activityGallery";
import type {
	GalleryItemDto,
	GalleryListDto,
} from "~~/server/dto/activityGallery/list";

const FILENAME = "activity-gallery/list.get.ts";

export default defineEventHandler(async (event): Promise<GalleryListDto> => {
	try {
		const query = getQuery(event);
		const id = String(query.id ?? "");
		if (!id) {
			throw createError({ statusCode: 400, message: "id is required" });
		}
		const idx = readIndex(id);
		const items: GalleryItemDto[] = idx.photos.map((p) => ({
			id: p.id,
			url: `/api/activity-gallery/photo?activityId=${encodeURIComponent(
				id,
			)}&photoId=${encodeURIComponent(p.id)}`,
			width: p.width,
			height: p.height,
			uploadedBy: p.uploadedBy,
			uploadedAt: p.uploadedAt,
		}));
		return { items };
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to list photos" });
	}
});
