import axios from "axios";
import { byIdProduct } from "~~/server/dto/product/byId";

const FILENAME = "product/delete.delete.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const query = getQuery(event);
		const id = query.id;

		const res = await axios.delete<byIdProduct>(
			`${config.api}/news/` + String(id),
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
