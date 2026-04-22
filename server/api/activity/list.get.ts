import axios from "axios";

const FILENAME = "activities/list.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const query = getQuery(event);
		const status = query.status;

		let url = `${config.api}/activities?`;
		if (status) {
			url += `status=${status}`;
		}

		const res = await axios.get(url, {
			headers: {
				cookie,
			},
			withCredentials: true,
		});
		console.log(url);

		return res.data;
	} catch (err) {
		console.log("error at " + FILENAME + ": " + String(err));
		console.log(err);
		throw createError({
			statusCode: 500,
		});
	}
});
