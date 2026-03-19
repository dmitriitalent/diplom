import axios from "axios";
import { RefreshDto } from "~~/server/dto/refresh.dto";

const FILENAME = "auth/refresh.post.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.post<RefreshDto>(
			`${config.api}/auth/refresh`,
			{},
			{
				headers: {
					cookie,
				},
				withCredentials: true,
			},
		);

		setCookie(event, "accessToken", res.data.accessToken);
		setCookie(event, "refreshToken", res.data.refreshToken);

		return "refresh success";
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);

		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message,
		});
	}
});
