import axios from "axios";

const FILENAME = "news/create.post.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();

		const body = await readBody(event);
		body.price = Number(body.price);

		const cookie = getHeader(event, "cookie");
		const url = `${config.api}/news`;

		const res = await axios.post(url, body, {
			headers: {
				cookie,
			},
			withCredentials: true,
		});

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);

		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message,
		});
	}
});
