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
	type PapersRoom,
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

const peerMeta = new WeakMap<object, PeerMeta>();

function getUserIdFromCookie(cookie: string | undefined): string | null {
	const payload = decodeAccessToken(cookie);
	return payload?.sub ?? null;
}

function sendError(peer: any, message: string) {
	try {
		peer.send(JSON.stringify({ type: "error", message }));
	} catch {}
}

export default defineWebSocketHandler({
	open(peer) {
		const cookie =
			(peer.request?.headers as any)?.get?.("cookie") ??
			(peer.request?.headers as any)?.cookie ??
			"";
		const userId = getUserIdFromCookie(cookie);
		if (!userId) {
			sendError(peer, "Unauthorized");
			try {
				peer.close();
			} catch {}
			return;
		}
		peerMeta.set(peer as any, { userId });
		registerPeer({
			id: String(peer.id),
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
		unregisterPeer(String(peer.id));
	},

	error(peer) {
		unregisterPeer(String(peer.id));
	},

	message(peer, message) {
		const meta = peerMeta.get(peer as any);
		if (!meta) {
			sendError(peer, "Unauthorized");
			return;
		}
		const userId = meta.userId;
		let msg: any;
		try {
			msg = JSON.parse(String(message.text ? message.text() : message));
		} catch {
			sendError(peer, "Bad JSON");
			return;
		}

		try {
			handleMessage(String(peer.id), userId, msg, peer);
		} catch (err: any) {
			sendError(peer, err?.message ?? "Internal error");
		}
	},
});

function handleMessage(
	peerId: string,
	userId: string,
	msg: any,
	peer: any,
) {
	if (msg?.type === "join-room") {
		const roomId = String(msg.roomId ?? "");
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

	if (msg?.type === "leave-room") {
		const roomId = String(msg.roomId ?? "");
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

	const peerInfo = msg.roomId ? String(msg.roomId) : null;
	const roomId = peerInfo ?? findRoomIdForPeer(peerId);
	if (!roomId) {
		sendError(peer, "Не подключён к комнате");
		return;
	}
	const room = readRoom(roomId);
	if (!room) {
		sendError(peer, "Комната не найдена");
		return;
	}

	switch (msg.type) {
		case "settings-update": {
			if (room.hostId !== userId) return sendError(peer, "Только хост");
			if (room.status !== "lobby") return sendError(peer, "Игра уже идёт");
			if (room.game === "alias") {
				Object.assign(room.settings, msg.settings ?? {});
			} else {
				Object.assign(room.settings, msg.settings ?? {});
			}
			room.updatedAt = new Date().toISOString();
			writeRoom(room);
			broadcastRoom(roomId);
			break;
		}
		case "start-game": {
			if (room.hostId !== userId) return sendError(peer, "Только хост");
			const err =
				room.game === "alias"
					? startAlias(room as AliasRoom)
					: startPapers(room as PapersRoom);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			break;
		}
		case "alias-start-turn": {
			if (room.game !== "alias") return;
			const turn =
				room.state.turnQueue[room.state.currentTurnIdx];
			if (!turn) return;
			if (turn.speakerUserId !== userId)
				return sendError(peer, "Не ваш ход");
			const err = aliasStartRound(room as AliasRoom);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			break;
		}
		case "alias-action": {
			if (room.game !== "alias") return;
			const turn =
				room.state.turnQueue[room.state.currentTurnIdx];
			if (!turn) return;
			if (turn.speakerUserId !== userId)
				return sendError(peer, "Не ваш ход");
			const action = msg.action === "skipped" ? "skipped" : "guessed";
			const err = aliasAction(room as AliasRoom, action);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			break;
		}
		case "alias-end-round": {
			if (room.game !== "alias") return;
			const turn =
				room.state.turnQueue[room.state.currentTurnIdx];
			if (!turn) return;
			if (turn.speakerUserId !== userId && room.hostId !== userId)
				return sendError(peer, "Не вашe действие");
			const err = aliasEndRound(room as AliasRoom);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			break;
		}
		case "alias-next-turn": {
			if (room.game !== "alias") return;
			if (room.hostId !== userId)
				return sendError(peer, "Только хост");
			const err = aliasNextTurn(room as AliasRoom);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			break;
		}
		case "papers-assign-word": {
			if (room.game !== "papers") return;
			const err = papersSubmitWord(
				room as PapersRoom,
				userId,
				String(msg.word ?? ""),
			);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			break;
		}
		case "papers-finish-player": {
			if (room.game !== "papers") return;
			if (room.hostId !== userId) return sendError(peer, "Только хост");
			const err = papersFinishPlayer(
				room as PapersRoom,
				String(msg.userId ?? ""),
			);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			break;
		}
		case "papers-new-word": {
			if (room.game !== "papers") return;
			if (room.hostId !== userId) return sendError(peer, "Только хост");
			const err = papersNewWord(
				room as PapersRoom,
				String(msg.userId ?? ""),
			);
			if (err) return sendError(peer, err);
			broadcastRoom(roomId);
			break;
		}
		case "new-game": {
			if (room.hostId !== userId) return sendError(peer, "Только хост");
			resetRoomToLobby(room);
			broadcastRoom(roomId);
			break;
		}
		case "kick": {
			if (room.hostId !== userId) return sendError(peer, "Только хост");
			const targetId = String(msg.userId ?? "");
			room.players = room.players.filter((p) => p.userId !== targetId);
			room.updatedAt = new Date().toISOString();
			writeRoom(room);
			broadcastRoom(roomId);
			break;
		}
		default:
			sendError(peer, "Unknown message type");
	}
}

function findRoomIdForPeer(peerId: string): string | null {
	const p = getPeer(peerId);
	return p?.roomId ?? null;
}
