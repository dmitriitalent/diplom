import { loadDictsManifest } from "~~/server/utils/games";

const FILENAME = "games/dicts.get.ts";

export default defineEventHandler(async () => {
	try {
		return loadDictsManifest();
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		throw createError({
			statusCode: 500,
			message: "Failed to load dicts manifest",
		});
	}
});
