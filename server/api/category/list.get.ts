import axios from "axios";
import { CategoriesDtoGetList } from "~~/server/dto/category/getList";

const FILENAME = "category/list.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.get<CategoriesDtoGetList>(
			`${config.api}/categories`,
			{
				headers: {
					cookie,
				},
				withCredentials: true,
			},
		);

		return res.data;
	} catch (err) {
		console.log("error at " + FILENAME + ": " + String(err));
		console.log(err);
		throw createError({
			statusCode: 500,
		});
	}
});
