import axios from "axios";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const res = await axios.get<{ pending_out: string[] }>(
			`${config.api}/friend/pending/out`,
			{ headers: { cookie }, withCredentials: true },
		);
		return res.data;
	} catch (err: any) {
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.error ?? String(err),
		});
	}
});
