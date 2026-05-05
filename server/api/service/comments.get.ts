import axios from "axios";
import type { ServiceCommentsListDto } from "~~/server/dto/service/comment";

const FILENAME = "service/comments.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const { id } = getQuery(event);

		const res = await axios.get<ServiceCommentsListDto>(
			`${config.api}/services/${String(id)}/comments`,
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
