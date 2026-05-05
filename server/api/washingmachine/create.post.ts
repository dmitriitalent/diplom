import axios from "axios";

const FILENAME = "washingmachine/create.post.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const body = await readBody(event);

		const res = await axios.post(
			`${config.api}/schedule/washingmachine`,
			body,
			{ headers: { cookie }, withCredentials: true },
		);

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.status);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message ?? String(err),
		});
	}
});
