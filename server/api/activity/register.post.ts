import axios from "axios";
import { NewsDtoById } from "~~/server/dto/news/byId";

const FILENAME = "activity/register.post.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const body = await readBody(event);

		console.log(body.id);
		const res = await axios.post(
			`${config.api}/activities/${body.id}/participants`,
			{},
			{
				headers: {
					cookie,
				},
				withCredentials: true,
			},
		);

		return res.data;
	} catch (err) {
		console.log("error at " + FILENAME + ": " + String(err));
		console.log(err);
		throw createError({
			statusCode: 500,
		});
	}
});
