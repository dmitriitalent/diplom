import axios from "axios";

const FILENAME = "user/self.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const body = readBody(event).then((res) => {
			console.log(res);
		});
	} catch (err) {
		console.log("error at " + FILENAME + ": " + String(err));
		console.log(err);
		throw createError({
			statusCode: 500,
		});
	}
});
