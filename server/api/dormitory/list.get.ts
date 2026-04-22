import axios from "axios";
import { DormitoryDtoGetList } from "~~/server/dto/dormitory/getList";

const FILENAME = "dormitroy/list.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.get<DormitoryDtoGetList>(
			`${config.api}/dormitory`,
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
