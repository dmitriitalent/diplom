import axios from "axios";
import { ErrorDto } from "~~/server/dto/error.dto";
import { LoginDto } from "~~/server/dto/login.dto";

const FILENAME = "auth/login.post.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const body = await readBody(event);

		const res = await axios.post<LoginDto>(
			`${config.api}/auth/login`,
			{
				login: body.login,
				password: body.password,
			},
			{
				withCredentials: true,
			},
		);

		setCookie(event, "accessToken", res.data.accessToken);
		setCookie(event, "refreshToken", res.data.refreshToken);

		return "login success";
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);

		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message,
		});
	}
});
