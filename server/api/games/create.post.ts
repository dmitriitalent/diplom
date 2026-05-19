import { decodeAccessToken } from "~~/server/utils/staticfiles";
import { fetchUnwrappedProfile } from "~~/server/utils/profile";
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

type CreateBody = { game?: "alias" | "papers" };
type CreateResponse = { id: string; code: string };

export default defineEventHandler(async (event): Promise<CreateResponse> => {
	try {
		const cookie = getHeader(event, "cookie");
		const payload = decodeAccessToken(cookie);
		const userId: string | undefined = payload?.sub;
		if (!userId) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const body = (await readBody<CreateBody>(event)) ?? {};
		const game: "alias" | "papers" =
			body.game === "papers" ? "papers" : "alias";

		const user = await fetchUnwrappedProfile(userId, cookie);

		const player: Player = {
			userId,
			name: user?.name ?? "Игрок",
			surname: user?.surname ?? "",
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
	} catch (err) {
		const e = err as { statusCode?: number; message?: string };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to create room" });
	}
});
