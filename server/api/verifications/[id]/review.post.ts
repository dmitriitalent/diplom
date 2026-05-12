import axios from "axios";

const FILENAME = "verifications/[id]/review.post.ts";

/** POST /api/verifications/:id/review — одобрить/отклонить заявку (ADMIN / COMMANDANT) */
export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const id = getRouterParam(event, "id");
		const body = await readBody<{ approve: boolean; comment?: string }>(event);

		if (!id) {
			throw createError({ statusCode: 400, message: "id is required" });
		}
		if (typeof body?.approve !== "boolean") {
			throw createError({ statusCode: 400, message: "approve (boolean) is required" });
		}

		const res = await axios.post(
			`${config.api}/verifications/${id}/review`,
			body,
			{ headers: { cookie }, withCredentials: true },
		);

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message ?? err?.message ?? "Review failed",
		});
	}
});
