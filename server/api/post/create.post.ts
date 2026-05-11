import axios from "axios";
import type { Post } from "~~/server/dto/post/post";

const FILENAME = "post/create.post.ts";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody<{
			content: string;
			imageIds?: string[];
			visibility?: string;
		}>(event);

		if (!body?.content?.trim()) {
			throw createError({ statusCode: 400, message: "content is required" });
		}

		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.post<Post>(
			`${config.api}/posts`,
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
