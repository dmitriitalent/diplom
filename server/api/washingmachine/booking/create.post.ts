import axios from "axios";

const FILENAME = "washingmachine/booking/create.post.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const { machineId } = getQuery(event);
		const body = await readBody(event);

		const res = await axios.post(
			`${config.api}/schedule/washingmachine/${String(machineId)}/booking`,
			body,
			{ headers: { cookie }, withCredentials: true },
		);

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.status);
		throw createError({
			statusCode: err?.response?.status || 500,
			message:
				err?.response?.data?.error ??
				err?.response?.data?.message ??
				String(err),
		});
	}
});
