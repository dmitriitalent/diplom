const FILENAME = "hei/hei.get.ts";

export default defineEventHandler(async (event) => {
	try {
		return [
			{
				name: "МАИ (Московский Авиационный Институт)",
				value: "MAI",
				leftIconName: "icon",
			},
			{
				name: "МЭИ (Московский Энергетический Институт)",
				value: "MEI",
				leftIconName: "icon",
			},
		];
	} catch (err) {
		console.log("error at " + FILENAME + ": " + String(err));
		console.log(err);
		throw createError({
			statusCode: 500,
		});
	}
});
