import axios from "axios";
import { NewsDtoById } from "~~/server/dto/news/byId";

const FILENAME = "activities/delete.delete.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const body = await readBody(event);

		const res = await axios.post<NewsDtoById>(
			`${config.api}/activities/join`,
			body,
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
