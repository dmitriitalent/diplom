import axios from "axios";
import { ProductDtoGetList } from "~~/server/dto/product/list";

const FILENAME = "product/list.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const query = getQuery(event);

		const params: Record<string, any> = {};
		if (query.category_id) params.category_id = String(query.category_id);
		if (query.owner_id) params.owner_id = String(query.owner_id);
		if (query.price_min) params.price_min = Number(query.price_min);
		if (query.price_max) params.price_max = Number(query.price_max);
		if (query.limit) params.limit = Number(query.limit);
		if (query.offset) params.offset = Number(query.offset);

		const res = await axios.get<ProductDtoGetList>(`${config.api}/products`, {
			headers: { cookie },
			withCredentials: true,
			params,
		});

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME + ": " + String(err));
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.error,
		});
	}
});
