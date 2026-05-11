import axios from "axios";

const FILENAME = "self/avatar.put.ts";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody<{ imageId: string }>(event);
		if (!body?.imageId) {
			throw createError({
				statusCode: 400,
				message: "imageId is required",
			});
		}

		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.put(
			`${config.api}/profile/avatar`,
			{ imageId: body.imageId },
			{
				headers: { cookie },
				withCredentials: true,
			},
		);

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME + ": " + String(err));
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message || err?.message || "Avatar update failed",
		});
	}
});
