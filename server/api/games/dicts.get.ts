import { loadDictsManifest, type DictsManifest } from "~~/server/utils/games";

const FILENAME = "games/dicts.get.ts";

export default defineEventHandler(async (): Promise<DictsManifest> => {
	try {
		return loadDictsManifest();
	} catch (err) {
		console.log("error at " + FILENAME, err);
		throw createError({
			statusCode: 500,
			message: "Failed to load dicts manifest",
		});
	}
});
