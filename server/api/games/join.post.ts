import axios from "axios";
import type { byId as Profile } from "~~/server/dto/profile/byId";
import { decodeAccessToken } from "~~/server/utils/staticfiles";
import {
	readRoom,
	resolveCode,
	writeRoom,
	type Player,
} from "~~/server/utils/games";

const FILENAME = "games/join.post.ts";

export default defineEventHandler(async (event) => {
	try {
		const cookie = getHeader(event, "cookie");
		const payload = decodeAccessToken(cookie);
		const userId = payload?.sub;
		if (!userId) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const body = await readBody(event);
		const code = String(body?.code ?? "").toUpperCase().trim();
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
			const config = useRuntimeConfig();
			let profile: Profile | null = null;
			try {
				const res = await axios.get<Profile>(
					`${config.api}/profile/` + String(userId),
					{ headers: { cookie }, withCredentials: true },
				);
				profile = res.data;
			} catch {
				profile = null;
			}

			const player: Player = {
				userId,
				name: profile?.name ?? "Игрок",
				surname: profile?.surname ?? "",
				online: false,
				joinedAt: new Date().toISOString(),
			};
			room.players.push(player);
			room.updatedAt = new Date().toISOString();
			writeRoom(room);
		}

		return { id: room.id, code: room.code };
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		if (err.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to join room" });
	}
});
