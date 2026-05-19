import axios from "axios";
import type { ActivityDtoById } from "~~/server/dto/activity/byId";

export async function canEditActivityGallery(
	activityId: string,
	userId: string,
	cookie: string | undefined,
): Promise<boolean> {
	if (!activityId || !userId) return false;
	const config = useRuntimeConfig();
	try {
		const res = await axios.get<ActivityDtoById>(
			`${config.api}/activities/${activityId}`,
			{
				headers: cookie ? { cookie } : undefined,
				withCredentials: true,
			},
		);
		const a = res.data;
		if (a.createdBy === userId) return true;
		const participants = a.participants ?? [];
		return participants.some(
			(p) => p.userId === userId && p.status !== "left",
		);
	} catch {
		return false;
	}
}
