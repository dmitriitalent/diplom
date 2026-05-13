import axios from "axios";

const FILENAME = "activities/list.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const query = getQuery(event);

		const params: Record<string, any> = {};
		if (query.status) params.status = String(query.status);
		if (query.limit) params.limit = Number(query.limit);
		if (query.offset) params.offset = Number(query.offset);

		const res = await axios.get(`${config.api}/activities`, {
			headers: {
				cookie,
			},
			withCredentials: true,
			params,
		});

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
