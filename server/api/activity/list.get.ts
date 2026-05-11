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
	} catch (err: any) {
		const status = err?.response?.status ?? err?.statusCode ?? 500;
		console.log("error at " + FILENAME + ": " + String(err));
		throw createError({
			statusCode: status,
			message: err?.response?.data?.error ?? err?.message ?? String(err),
		});
	}
});
