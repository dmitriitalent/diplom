import axios from "axios";
import type { Post } from "~~/server/dto/post/post";

const FILENAME = "post/byId.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const query = getQuery(event);
		const id = String(query.id ?? "");
		if (!id) {
			throw createError({ statusCode: 400, message: "id is required" });
		}

		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.get<Post>(`${config.api}/posts/${id}`, {
			headers: { cookie },
			withCredentials: true,
		});

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME + ": " + String(err));
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.error ?? err?.message ?? String(err),
		});
	}
});
