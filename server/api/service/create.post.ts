import axios from "axios";
import type { ServiceDtoById } from "~~/server/dto/service/byId";

const FILENAME = "service/create.post.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const body = await readBody(event);
		body.price = Number(body.price);

		const res = await axios.post<ServiceDtoById>(`${config.api}/services`, body, {
			headers: { cookie },
			withCredentials: true,
		});

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.error,
		});
	}
});
