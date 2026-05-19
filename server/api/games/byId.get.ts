import { readRoom, type Room } from "~~/server/utils/games";
import { decodeAccessToken } from "~~/server/utils/staticfiles";
import { maskRoomForUser } from "~~/server/utils/gamesBroker";

const FILENAME = "games/byId.get.ts";

export default defineEventHandler(async (event): Promise<Room> => {
	try {
		const cookie = getHeader(event, "cookie");
		const payload = decodeAccessToken(cookie);
		const userId: string | undefined = payload?.sub;
		if (!userId) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const query = getQuery(event);
		const id = String(query.id ?? "");
		const room = readRoom(id);
		if (!room) {
			throw createError({ statusCode: 404, message: "Комната не найдена" });
		}
		if (!room.players.some((p) => p.userId === userId)) {
			throw createError({ statusCode: 403, message: "Не участник" });
		}
		return maskRoomForUser(room, userId);
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to read room" });
	}
});
