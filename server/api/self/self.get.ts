import axios from "axios";
import { SelfDto } from "~~/server/dto/self.dto";

const FILENAME = "self/self.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const uid = JSON.parse(
			atob(parseCookies(event).accessToken.split(".")[1]!),
		).user_id;

		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.get<SelfDto>(
			`${config.api}/profile/` + String(uid),
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
