import axios from "axios";
import { DormitoryDtoGetById } from "~~/server/dto/dormitory/byId";

const FILENAME = "dormitroy/byId.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const query = getQuery(event);
		const id = query.id;

		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.get<DormitoryDtoGetById>(
			`${config.api}/dormitory/` + String(id),
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
