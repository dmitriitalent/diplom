import axios from "axios";
import type { ServiceDtoList } from "~~/server/dto/service/list";

const FILENAME = "service/list.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const query = getQuery(event);

		const params: Record<string, any> = {};
		if (query.price_min) params.price_min = Number(query.price_min);
		if (query.price_max) params.price_max = Number(query.price_max);
		if (query.limit) params.limit = Number(query.limit);
		if (query.offset) params.offset = Number(query.offset);

		const res = await axios.get<ServiceDtoList>(`${config.api}/services`, {
			headers: { cookie },
			withCredentials: true,
			params,
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
