import { pickRandomWord, type Lang } from "~~/server/utils/games";

const FILENAME = "games/pick-word.get.ts";

type PickWordResponse = { word: string | null };

export default defineEventHandler(async (event): Promise<PickWordResponse> => {
	try {
		const query = getQuery(event);
		const lang: Lang = query.lang === "en" ? "en" : "ru";
		const dict = String(query.dict ?? "orange_easy");
		const word = pickRandomWord(lang, dict);
		return { word: word ?? null };
	} catch (err) {
		console.log("error at " + FILENAME, err);
		throw createError({ statusCode: 500 });
	}
});
