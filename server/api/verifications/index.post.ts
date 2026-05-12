import axios from "axios";

const FILENAME = "verifications/index.post.ts";

/** POST /api/verifications — отправить заявку на верификацию */
export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const body = await readBody<{ documentId: string }>(event);

		if (!body?.documentId) {
			throw createError({ statusCode: 400, message: "documentId is required" });
		}

		const res = await axios.post(`${config.api}/verifications`, body, {
			headers: { cookie },
			withCredentials: true,
		});

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message ?? err?.message ?? "Verification create failed",
		});
	}
});
