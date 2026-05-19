import axios from "axios";
import { unwrapProfile } from "~~/app/utils/unwrapProfile";
import type { byId as ProfileDto } from "~~/server/dto/profile/byId";
import type { User } from "~~/app/entities/User";

export async function fetchUnwrappedProfile(
	userId: string,
	cookie: string | undefined,
): Promise<User | null> {
	const config = useRuntimeConfig();
	try {
		const res = await axios.get<ProfileDto>(
			`${config.api}/profile/${userId}`,
			{ headers: cookie ? { cookie } : undefined, withCredentials: true },
		);
		return unwrapProfile(res.data);
	} catch {
		return null;
	}
}
