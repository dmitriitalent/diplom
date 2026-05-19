import { decodeAccessToken } from "~~/server/utils/staticfiles";
import { canEditActivityGallery } from "~~/server/utils/activityAccess";
import { addTrack } from "~~/server/utils/activityMusic";
import { fetchTrackMetadata } from "~~/server/utils/trackMetadata";
import type { TrackDto } from "~~/server/dto/activityMusic/list";

const FILENAME = "activity-music/add.post.ts";

type AddBody = {
	title?: string;
	author?: string;
	link?: string;
};

export default defineEventHandler(async (event): Promise<TrackDto> => {
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
				message: "Только участники могут добавлять треки",
			});
		}

		const body = (await readBody<AddBody>(event)) ?? {};
		let title = (body.title ?? "").trim();
		let author = (body.author ?? "").trim();
		const link = (body.link ?? "").trim();
		let cover = "";

		if (!title && !link) {
			throw createError({
				statusCode: 400,
				message: "Укажите ссылку или название трека",
			});
		}

		if (link) {
			try {
				const u = new URL(link);
				if (u.protocol !== "http:" && u.protocol !== "https:") {
					throw new Error("bad");
				}
			} catch {
				throw createError({
					statusCode: 400,
					message: "Некорректная ссылка",
				});
			}

			const meta = await fetchTrackMetadata(link);
			if (!title && meta.title) title = meta.title;
			if (!author && meta.author) author = meta.author;
			if (meta.image) cover = meta.image;
		}

		return addTrack(activityId, {
			title,
			author,
			link,
			cover,
			addedBy: userId,
		});
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to add track" });
	}
});
