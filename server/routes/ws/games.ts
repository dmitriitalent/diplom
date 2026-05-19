import type { Peer, Message } from "crossws";
import { decodeAccessToken } from "~~/server/utils/staticfiles";
import {
	broadcastRoom,
	getPeer,
	joinRoom,
	leaveRoom,
	registerPeer,
	unregisterPeer,
} from "~~/server/utils/gamesBroker";
import {
	readRoom,
	writeRoom,
	type AliasRoom,
	type AliasSettings,
	type ClientMessage,
	type PapersRoom,
	type PapersSettings,
	type Room,
	type ServerMessage,
} from "~~/server/utils/games";
import {
	aliasAction,
	aliasEndRound,
	aliasNextTurn,
	aliasStartRound,
	papersFinishPlayer,
	papersNewWord,
	papersSubmitWord,
	resetRoomToLobby,
	startAlias,
	startPapers,
} from "~~/server/utils/gamesLogic";

type PeerMeta = { userId: string };
const peerMeta = new WeakMap<Peer, PeerMeta>();

function getUserIdFromCookie(cookie: string | undefined): string | null {
	const payload = decodeAccessToken(cookie);
	return payload?.sub ?? null;
}

function readCookie(peer: Peer): string {
	const headers = peer.request?.headers as
		| Headers
		| Record<string, string>
		| undefined;
	if (!headers) return "";
	if (typeof (headers as Headers).get === "function") {
		return (headers as Headers).get("cookie") ?? "";
	}
	const rec = headers as Record<string, string>;
	return rec.cookie ?? "";
}

function sendError(peer: Peer, message: string): void {
	const payload: ServerMessage = { type: "error", message };
	try {
		peer.send(JSON.stringify(payload));
	} catch {}
}

function findRoomIdForPeer(peerId: string): string | null {
	const p = getPeer(peerId);
	return p?.roomId ?? null;
}

export default defineWebSocketHandler({
	open(peer) {
		const cookie = readCookie(peer);
		const userId = getUserIdFromCookie(cookie);
		if (!userId) {
			sendError(peer, "Unauthorized");
			try {
				peer.close();
			} catch {}
			return;
		}
		peerMeta.set(peer, { userId });
		registerPeer({
			id: peer.id,
			userId,
			roomId: null,
			send: (data) => {
				try {
					peer.send(data);
				} catch {}
			},
		});
	},

	close(peer) {
		unregisterPeer(peer.id);
	},

	error(peer) {
		unregisterPeer(peer.id);
	},

	message(peer, message: Message) {
		const meta = peerMeta.get(peer);
		if (!meta) {
			sendError(peer, "Unauthorized");
			return;
		}
		const userId = meta.userId;
		let msg: ClientMessage;
		try {
			msg = JSON.parse(message.text()) as ClientMessage;
		} catch {
			sendError(peer, "Bad JSON");
			return;
		}

		try {
			handleMessage(peer.id, userId, msg, peer);
		} catch (err) {
			const e = err as { message?: string };
			sendError(peer, e.message ?? "Internal error");
		}
	},
});

function handleMessage(
	peerId: string,
	userId: string,
	msg: ClientMessage,
	peer: Peer,
): void {
	if (msg.type === "join-room") {
		const roomId = msg.roomId;
		const room = readRoom(roomId);
		if (!room) {
			sendError(peer, "Комната не найдена");
			return;
		}
		const player = room.players.find((p) => p.userId === userId);
		if (!player) {
			sendError(peer, "Вы не участник этой комнаты");
			return;
		}
		joinRoom(peerId, roomId);
		broadcastRoom(roomId);
		return;
	}

	if (msg.type === "leave-room") {
		const roomId = msg.roomId;
		const room = readRoom(roomId);
		if (room) {
			room.players = room.players.filter((p) => p.userId !== userId);
			if (room.hostId === userId && room.players[0]) {
				room.hostId = room.players[0].userId;
			}
			room.updatedAt = new Date().toISOString();
			writeRoom(room);
		}
		leaveRoom(peerId, roomId);
		broadcastRoom(roomId);
		return;
	}

	const roomId = findRoomIdForPeer(peerId);
	if (!roomId) {
		sendError(peer, "Не подключён к комнате");
		return;
	}
	const room = readRoom(roomId);
	if (!room) {
		sendError(peer, "Комната не найдена");
		return;
	}

	dispatchInRoom(room, roomId, userId, msg, peer);
}

function dispatchInRoom(
	room: Room,
	roomId: string,
	userId: string,
	msg: ClientMessage,
	peer: Peer,
): void {
	switch (msg.type) {
		case "settings-update": {
			if (room.hostId !== userId) return sendError(peer, "Только хост");
			if (room.status !== "lobby")
				return sendError(peer, "Игра уже идёт");
			if (room.game === "alias") {
				Object.assign(
					room.settings,
					msg.settings as Partial<AliasSettings>,
				);
			} else {
				Object.assign(
					room.settings,
					msg.settings as Partial<PapersSettings>,
				);
			}
			room.updatedAt = new Date().toISOString();
			writeRoom(room);
			broadcastRoom(roomId);
			return;
		}
		case "start-game": {
			if (room.hostId !== userId) return sendError(peer, "Только хост");
			const err =
				room.game === "alias"
					? startAlias(room as AliasRoom)
					: startPapers(room as PapersRoom);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			return;
		}
		case "alias-start-turn": {
			if (room.game !== "alias") return;
			const turn = room.state.turnQueue[room.state.currentTurnIdx];
			if (!turn) return;
			if (turn.speakerUserId !== userId)
				return sendError(peer, "Не ваш ход");
			const err = aliasStartRound(room);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			return;
		}
		case "alias-action": {
			if (room.game !== "alias") return;
			const turn = room.state.turnQueue[room.state.currentTurnIdx];
			if (!turn) return;
			if (turn.speakerUserId !== userId)
				return sendError(peer, "Не ваш ход");
			const action: "guessed" | "skipped" =
				msg.action === "skipped" ? "skipped" : "guessed";
			const err = aliasAction(room, action);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			return;
		}
		case "alias-end-round": {
			if (room.game !== "alias") return;
			const turn = room.state.turnQueue[room.state.currentTurnIdx];
			if (!turn) return;
			if (turn.speakerUserId !== userId && room.hostId !== userId)
				return sendError(peer, "Не ваше действие");
			const err = aliasEndRound(room);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			return;
		}
		case "alias-next-turn": {
			if (room.game !== "alias") return;
			if (room.hostId !== userId)
				return sendError(peer, "Только хост");
			const err = aliasNextTurn(room);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			return;
		}
		case "papers-assign-word": {
			if (room.game !== "papers") return;
			const err = papersSubmitWord(room, userId, msg.word ?? "");
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			return;
		}
		case "papers-finish-player": {
			if (room.game !== "papers") return;
			if (room.hostId !== userId) return sendError(peer, "Только хост");
			const err = papersFinishPlayer(room, msg.userId);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			return;
		}
		case "papers-new-word": {
			if (room.game !== "papers") return;
			if (room.hostId !== userId) return sendError(peer, "Только хост");
			const err = papersNewWord(room, msg.userId);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			return;
		}
		case "new-game": {
			if (room.hostId !== userId) return sendError(peer, "Только хост");
			resetRoomToLobby(room);
			broadcastRoom(roomId);
			return;
		}
		case "kick": {
			if (room.hostId !== userId) return sendError(peer, "Только хост");
			room.players = room.players.filter(
				(p) => p.userId !== msg.userId,
			);
			room.updatedAt = new Date().toISOString();
			writeRoom(room);
			broadcastRoom(roomId);
			return;
		}
	}
}
