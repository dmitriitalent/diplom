import { readMusic } from "~~/server/utils/activityMusic";
import type { MusicListDto } from "~~/server/dto/activityMusic/list";

const FILENAME = "activity-music/list.get.ts";

export default defineEventHandler(async (event): Promise<MusicListDto> => {
	try {
		const query = getQuery(event);
		const id = String(query.id ?? "");
		if (!id) {
			throw createError({ statusCode: 400, message: "id is required" });
		}
		const data = readMusic(id);
		return { tracks: data.tracks };
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to list tracks" });
	}
});
