import axios from "axios";
import type { PostListDto } from "~~/server/dto/post/post";

const FILENAME = "profile/posts.get.ts";

// GET /api/profile/posts?userId=...
// → backend: GET /profile/{userId}/posts
export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const query = getQuery(event);

		const userId = String(query.userId ?? query.user_id ?? "");
		if (!userId) {
			throw createError({ statusCode: 400, message: "userId is required" });
		}

		const res = await axios.get<PostListDto>(
			`${config.api}/profile/${userId}/posts`,
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
