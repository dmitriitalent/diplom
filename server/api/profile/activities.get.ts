import axios from "axios";
import type { ActivityDtoList } from "~~/server/dto/activity/list";

const FILENAME = "profile/activities.get.ts";

// GET /api/profile/activities?userId=...&status=...
// → backend: GET /profile/{userId}/activities
export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const query = getQuery(event);

		const userId = String(query.userId ?? query.user_id ?? "");
		if (!userId) {
			throw createError({
				statusCode: 400,
				message: "userId is required",
			});
		}

		const params: Record<string, any> = {};
		if (query.status) params.status = String(query.status);
		if (query.limit) params.limit = Number(query.limit);
		if (query.offset) params.offset = Number(query.offset);

		const res = await axios.get<ActivityDtoList>(
			`${config.api}/profile/${userId}/activities`,
			{
				headers: { cookie },
				withCredentials: true,
				params,
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
