import axios from "axios";
import { CategoriesDtoGetList } from "~~/server/dto/category/getList";
import { ProductDtoGetList } from "~~/server/dto/product/list";

const FILENAME = "news/list.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const query = getQuery(event);

		const params: Record<string, any> = {};
		if (query.status) params.status = String(query.status);
		if (query.limit) params.limit = Number(query.limit);
		if (query.offset) params.offset = Number(query.offset);

		const res = await axios.get<ProductDtoGetList>(`${config.api}/news`, {
			headers: {
				cookie,
			},
			withCredentials: true,
			params,
		});

		return res.data;
	} catch (err) {
		console.log("error at " + FILENAME + ": " + String(err));
		console.log(err);
		throw createError({
			statusCode: 500,
		});
	}
});
