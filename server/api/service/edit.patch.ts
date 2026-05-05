import axios from "axios";
import type { ServiceDtoById } from "~~/server/dto/service/byId";

const FILENAME = "service/edit.patch.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const body = await readBody(event);
		body.price = Number(body.price);
		const { id } = getQuery(event);

		const res = await axios.patch<ServiceDtoById>(
			`${config.api}/services/${String(id)}`,
			body,
			{
				headers: { cookie },
				withCredentials: true,
			},
		);

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, JSON.stringify(err?.response?.data), "status:", err?.response?.status);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.error ?? err?.response?.data?.message ?? JSON.stringify(err?.response?.data),
		});
	}
});
