import { pickRandomWord, type Lang } from "~~/server/utils/games";

const FILENAME = "games/pick-word.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const query = getQuery(event);
		const lang = (query.lang === "en" ? "en" : "ru") as Lang;
		const dict = String(query.dict ?? "orange_easy");
		const word = pickRandomWord(lang, dict);
		return { word: word ?? null };
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		throw createError({ statusCode: 500 });
	}
});
