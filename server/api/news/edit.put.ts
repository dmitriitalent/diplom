import axios from "axios";

const FILENAME = "news/edit.put.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const body = await readBody(event);
		const query = getQuery(event);
		const id = query.id;

		const res = await axios.put(
			`${config.api}/news/` + String(id),
			body,
			{
				headers: { cookie },
				withCredentials: true,
			},
		);

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);

		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message,
		});
	}
});
