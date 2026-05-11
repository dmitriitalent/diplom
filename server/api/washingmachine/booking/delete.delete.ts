import axios from "axios";

const FILENAME = "washingmachine/booking/delete.delete.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const { id, from, till } = getQuery(event);

		const res = await axios.delete(
			`${config.api}/schedule/washingmachine/booking`,
			{
				params: {
					id: String(id),
					from: Number(from),
					till: Number(till),
				},
				headers: { cookie },
				withCredentials: true,
			},
		);

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.status);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message ?? String(err),
		});
	}
});
