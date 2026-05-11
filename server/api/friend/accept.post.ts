import axios from "axios";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const { friendId } = getQuery(event);
		const res = await axios.post(
			`${config.api}/friend/accept/${String(friendId)}`,
			{},
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
