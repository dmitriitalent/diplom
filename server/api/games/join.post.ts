import { decodeAccessToken } from "~~/server/utils/staticfiles";
import { fetchUnwrappedProfile } from "~~/server/utils/profile";
import {
	readRoom,
	resolveCode,
	writeRoom,
	type Player,
} from "~~/server/utils/games";

const FILENAME = "games/join.post.ts";

type JoinBody = { code?: string };
type JoinResponse = { id: string; code: string };

export default defineEventHandler(async (event): Promise<JoinResponse> => {
	try {
		const cookie = getHeader(event, "cookie");
		const payload = decodeAccessToken(cookie);
		const userId: string | undefined = payload?.sub;
		if (!userId) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const body = (await readBody<JoinBody>(event)) ?? {};
		const code = String(body.code ?? "").toUpperCase().trim();
		if (!/^[A-Z0-9]{8}$/.test(code)) {
			throw createError({ statusCode: 400, message: "Неверный код" });
		}

		const roomId = resolveCode(code);
		if (!roomId) {
			throw createError({ statusCode: 404, message: "Комната не найдена" });
		}

		const room = readRoom(roomId);
		if (!room) {
			throw createError({ statusCode: 404, message: "Комната не найдена" });
		}

		if (room.status !== "lobby") {
			const existing = room.players.find((p) => p.userId === userId);
			if (!existing) {
				throw createError({ statusCode: 409, message: "Игра уже идёт" });
			}
		}

		if (!room.players.some((p) => p.userId === userId)) {
			const user = await fetchUnwrappedProfile(userId, cookie);
			const player: Player = {
				userId,
				name: user?.name ?? "Игрок",
				surname: user?.surname ?? "",
				online: false,
				joinedAt: new Date().toISOString(),
			};
			room.players.push(player);
			room.updatedAt = new Date().toISOString();
			writeRoom(room);
		}

		return { id: room.id, code: room.code };
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to join room" });
	}
});
