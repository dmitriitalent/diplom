import axios from "axios";
import { ErrorDto } from "~~/server/dto/error.dto";

const FILENAME = "auth/logout.post.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		await axios.post(`${config.api}/auth/logout`, {
			headers: {
				cookie,
			},
			withCredentials: true,
		});

		deleteCookie(event, "accessToken");
		deleteCookie(event, "refreshToken");

		return "logout success";
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);

		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message,
		});
	}
});
