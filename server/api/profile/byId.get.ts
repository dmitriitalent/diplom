import axios from "axios";
import { byId } from "~~/server/dto/profile/byId";

const FILENAME = "profile/profile.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const query = getQuery(event);
		const id = query.id;

		const res = await axios.get<byId>(
			`${config.api}/profile/` + String(id),
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
