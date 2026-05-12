import axios from "axios";

const FILENAME = "verifications/me.get.ts";

/** GET /api/verifications/me — последняя заявка текущего пользователя */
export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.get(`${config.api}/verifications/me`, {
			headers: { cookie },
			withCredentials: true,
			validateStatus: (s) => (s >= 200 && s < 300) || s === 404,
		});

		// 404 — заявок ещё не было
		if (res.status === 404) return null;
		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message ?? err?.message ?? "Verification fetch failed",
		});
	}
});
