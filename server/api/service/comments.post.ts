import axios from "axios";
import type { ServiceCommentDto } from "~~/server/dto/service/comment";

const FILENAME = "service/comments.post.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const body = await readBody(event);
		const { id } = getQuery(event);

		const res = await axios.post<ServiceCommentDto>(
			`${config.api}/services/${String(id)}/comments`,
			body,
			{
				headers: { cookie },
				withCredentials: true,
			},
		);

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.error,
		});
	}
});
