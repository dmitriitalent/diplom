import axios from "axios";

const FILENAME = "shower/byId.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const { id } = getQuery(event);

		const res = await axios.get(`${config.api}/schedule/shower`, {
			params: { id: String(id) },
			headers: { cookie },
			withCredentials: true,
		});

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.status);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message ?? String(err),
		});
	}
});
