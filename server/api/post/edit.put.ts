import axios from "axios";
import type { Post } from "~~/server/dto/post/post";

const FILENAME = "post/edit.put.ts";

export default defineEventHandler(async (event) => {
	try {
		const query = getQuery(event);
		const id = String(query.id ?? "");
		if (!id) {
			throw createError({ statusCode: 400, message: "id is required" });
		}

		const body = await readBody<{
			content: string;
			imageIds?: string[];
			visibility?: string;
		}>(event);

		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.put<Post>(
			`${config.api}/posts/${id}`,
			{
				content: body.content,
				imageIds: body.imageIds ?? [],
				visibility: body.visibility ?? "EVERYONE",
			},
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
			message: err?.response?.data?.error ?? err?.message ?? String(err),
		});
	}
});
