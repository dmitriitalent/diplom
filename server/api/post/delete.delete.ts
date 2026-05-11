import axios from "axios";

const FILENAME = "post/delete.delete.ts";

export default defineEventHandler(async (event) => {
	try {
		const query = getQuery(event);
		const id = String(query.id ?? "");
		if (!id) {
			throw createError({ statusCode: 400, message: "id is required" });
		}

		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		await axios.delete(`${config.api}/posts/${id}`, {
			headers: { cookie },
			withCredentials: true,
		});

		return { ok: true };
	} catch (err: any) {
		console.log("error at " + FILENAME + ": " + String(err));
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.error ?? err?.message ?? String(err),
		});
	}
});
