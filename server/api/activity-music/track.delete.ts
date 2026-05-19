import { decodeAccessToken } from "~~/server/utils/staticfiles";
import { canEditActivityGallery } from "~~/server/utils/activityAccess";
import { readMusic, removeTrack } from "~~/server/utils/activityMusic";

const FILENAME = "activity-music/track.delete.ts";

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
		const trackId = String(query.trackId ?? "");
		if (!activityId || !trackId) {
			throw createError({
				statusCode: 400,
				message: "activityId and trackId required",
			});
		}

		const data = readMusic(activityId);
		const track = data.tracks.find((t) => t.id === trackId);
		if (!track) {
			throw createError({ statusCode: 404, message: "Track not found" });
		}

		const isOwner = track.addedBy === userId;
		const canEdit = isOwner
			? true
			: await canEditActivityGallery(activityId, userId, cookie);
		if (!isOwner && !canEdit) {
			throw createError({ statusCode: 403, message: "Forbidden" });
		}

		removeTrack(activityId, trackId);
		return { deleted: true };
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to delete track" });
	}
});
