import axios from "axios";

const FILENAME = "shower/edit.put.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const body = await readBody(event);
		const { id } = getQuery(event);

		const res = await axios.put(`${config.api}/showers/${String(id)}`, body, {
			headers: { cookie },
			withCredentials: true,
		});

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, JSON.stringify(err?.response?.data), "status:", err?.response?.status);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.error ?? err?.response?.data?.message ?? String(err),
		});
	}
});
