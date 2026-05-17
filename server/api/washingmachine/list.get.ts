import axios from "axios";
import type { WashingMachineDto } from "~~/server/dto/washingmachine/index";

const FILENAME = "washingmachine/list.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const res = await axios.get<WashingMachineDto[]>(
			`${config.api}/schedule/washingmachine`,
			{ headers: { cookie }, withCredentials: true },
		);

		const machines: WashingMachineDto[] = res.data;

		// Decode JWT to get user id and roles
		const accessToken = parseCookies(event).accessToken;
		if (!accessToken) return machines;

		let jwtPayload: Record<string, any>;
		try {
			jwtPayload = JSON.parse(atob(accessToken.split(".")[1]!));
		} catch {
			return machines;
		}

		const roles: string[] = Array.isArray(jwtPayload.roles)
			? jwtPayload.roles
			: [];
		const isAdmin = roles.includes("ADMIN");

		// Admin sees every machine regardless of floor
		if (isAdmin) return machines;

		// Fetch user profile to get their floor
		const userId = jwtPayload.user_id ?? jwtPayload.sub;
		let userFloor: string | undefined;
		try {
			const profileRes = await axios.get<{ floor?: { value?: string } }>(
				`${config.api}/profile/${userId}`,
				{ headers: { cookie }, withCredentials: true },
			);
			userFloor = profileRes.data?.floor?.value ?? undefined;
		} catch {
			// If profile fetch fails, return only machines with no floor restriction
		}

		// Keep machine if it has no floor restriction OR floor matches user's floor
		return machines.filter(
			(m) => !m.floor || !m.floor.trim() || m.floor.trim() === userFloor?.trim(),
		);
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.status);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.message ?? String(err),
		});
	}
});
