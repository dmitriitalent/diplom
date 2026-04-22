import axios from "axios";

const FILENAME = "images/byGuid.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();

		const { guid } = getQuery(event);

		const url = `${config.api}/images/${guid}`;
		const cookie = getHeader(event, "cookie");

		const res = await axios.get(url, {
			responseType: "arraybuffer",
			headers: {
				cookie,
			},
			withCredentials: true,
		});

		setHeader(
			event,
			"content-type",
			res.headers["content-type"] || "application/octet-stream",
		);

		return Buffer.from(res.data);
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);

		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message || "Static proxy error",
		});
	}
});
