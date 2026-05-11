import axios from "axios";

const FILENAME = "self/avatar.delete.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.delete(`${config.api}/profile/avatar`, {
			headers: { cookie },
			withCredentials: true,
		});

		return res.data ?? { ok: true };
	} catch (err: any) {
		console.log("error at " + FILENAME + ": " + String(err));
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message || err?.message || "Avatar delete failed",
		});
	}
});
