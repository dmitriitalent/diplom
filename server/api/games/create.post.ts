import axios from "axios";
import type { byId as Profile } from "~~/server/dto/profile/byId";
import { decodeAccessToken } from "~~/server/utils/staticfiles";
import {
	genRoomId,
	genUniqueCode,
	writeCode,
	writeRoom,
	makeAliasInitialState,
	makePapersInitialState,
	type Room,
	type AliasSettings,
	type PapersSettings,
	type Player,
} from "~~/server/utils/games";

const FILENAME = "games/create.post.ts";

export default defineEventHandler(async (event) => {
	try {
		const cookie = getHeader(event, "cookie");
		const payload = decodeAccessToken(cookie);
		const userId = payload?.sub;
		if (!userId) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const body = await readBody(event);
		const game = body?.game === "papers" ? "papers" : "alias";

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

		const id = genRoomId();
		const code = genUniqueCode();
		const now = new Date().toISOString();

		let room: Room;
		if (game === "alias") {
			const settings: AliasSettings = {
				lang: "ru",
				dictionary: "orange_easy",
				roundTime: 60,
				scoreToWin: 30,
				skipPenalty: true,
			};
			room = {
				id,
				code,
				hostId: userId,
				createdAt: now,
				updatedAt: now,
				status: "lobby",
				players: [player],
				game: "alias",
				settings,
				state: makeAliasInitialState(),
			};
		} else {
			const settings: PapersSettings = {
				mode: "auto",
				lang: "ru",
				dictionary: "orange_easy",
			};
			room = {
				id,
				code,
				hostId: userId,
				createdAt: now,
				updatedAt: now,
				status: "lobby",
				players: [player],
				game: "papers",
				settings,
				state: makePapersInitialState(),
			};
		}

		writeRoom(room);
		writeCode(code, id);
		return { id, code };
	} catch (err: any) {
		console.log("error at " + FILENAME, err);
		if (err.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to create room" });
	}
});
