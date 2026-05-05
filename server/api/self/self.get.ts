import axios from "axios";
import { byId } from "~~/server/dto/self/byId";
import { SelfDto } from "~~/server/dto/self.dto";

const FILENAME = "self/self.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const accessToken = parseCookies(event).accessToken;
		if (!accessToken) {
			throw createError({ statusCode: 401, message: "No access token" });
		}

		const uid = JSON.parse(atob(accessToken.split(".")[1]!)).user_id;

		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.get<byId>(
			`${config.api}/profile/` + String(uid),
			{
				headers: { cookie },
				withCredentials: true,
			},
		);

		return res.data;
	} catch (err: any) {
		const status = err?.response?.status ?? err?.statusCode ?? 500;
		console.log("error at " + FILENAME + ": " + String(err));
		throw createError({
			statusCode: status,
			message: err?.response?.data?.error ?? err?.message ?? String(err),
		});
	}
});
