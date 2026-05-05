import axios from "axios";

const FILENAME = "service/delete.delete.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const { id } = getQuery(event);

		const res = await axios.delete(`${config.api}/services/${String(id)}`, {
			headers: { cookie },
			withCredentials: true,
		});

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.error,
		});
	}
});
