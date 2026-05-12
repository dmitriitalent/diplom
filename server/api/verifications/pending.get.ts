import axios from "axios";

const FILENAME = "verifications/pending.get.ts";

/** GET /api/verifications/pending — список заявок на проверке (ADMIN / COMMANDANT) */
export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.get(`${config.api}/verifications/pending`, {
			headers: { cookie },
			withCredentials: true,
		});

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message ?? err?.message ?? "Pending list failed",
		});
	}
});
