import type { Room } from "./games";
import { readRoom, writeRoom, deleteRoom } from "./games";

type Peer = {
	id: string;
	userId: string;
	roomId: string | null;
	send: (data: string) => void;
};

const peers = new Map<string, Peer>();
const roomPeers = new Map<string, Set<string>>();
const cleanupTimers = new Map<string, NodeJS.Timeout>();

const GRACE_MS = 30_000;

export function registerPeer(peer: Peer) {
	peers.set(peer.id, peer);
}

export function unregisterPeer(peerId: string) {
	const peer = peers.get(peerId);
	if (!peer) return;
	if (peer.roomId) leaveRoom(peerId, peer.roomId);
	peers.delete(peerId);
}

export function joinRoom(peerId: string, roomId: string) {
	const peer = peers.get(peerId);
	if (!peer) return;
	if (peer.roomId && peer.roomId !== roomId) {
		leaveRoom(peerId, peer.roomId);
	}
	peer.roomId = roomId;
	let set = roomPeers.get(roomId);
	if (!set) {
		set = new Set();
		roomPeers.set(roomId, set);
	}
	set.add(peerId);

	const timer = cleanupTimers.get(roomId);
	if (timer) {
		clearTimeout(timer);
		cleanupTimers.delete(roomId);
	}

	const room = readRoom(roomId);
	if (room) {
		const player = room.players.find((p) => p.userId === peer.userId);
		if (player) {
			player.online = true;
			room.updatedAt = new Date().toISOString();
			writeRoom(room);
		}
	}
}

export function leaveRoom(peerId: string, roomId: string) {
	const peer = peers.get(peerId);
	if (peer) peer.roomId = null;

	const set = roomPeers.get(roomId);
	if (set) {
		set.delete(peerId);
		if (set.size === 0) roomPeers.delete(roomId);
	}

	const room = readRoom(roomId);
	if (!room) return;

	if (peer) {
		const stillConnected = Array.from(peers.values()).some(
			(p) => p.userId === peer.userId && p.roomId === roomId,
		);
		if (!stillConnected) {
			const player = room.players.find((p) => p.userId === peer.userId);
			if (player) {
				player.online = false;
				room.updatedAt = new Date().toISOString();
				writeRoom(room);
			}
		}
	}

	scheduleCleanupIfEmpty(roomId);
}

export function scheduleCleanupIfEmpty(roomId: string) {
	const set = roomPeers.get(roomId);
	if (set && set.size > 0) return;
	const existing = cleanupTimers.get(roomId);
	if (existing) clearTimeout(existing);
	const t = setTimeout(() => {
		cleanupTimers.delete(roomId);
		const still = roomPeers.get(roomId);
		if (still && still.size > 0) return;
		deleteRoom(roomId);
	}, GRACE_MS);
	cleanupTimers.set(roomId, t);
}

export function getPeersInRoom(roomId: string): Peer[] {
	const set = roomPeers.get(roomId);
	if (!set) return [];
	const out: Peer[] = [];
	for (const id of set) {
		const p = peers.get(id);
		if (p) out.push(p);
	}
	return out;
}

export function maskRoomForUser(room: Room, viewerUserId: string): Room {
	if (room.game === "alias") {
		const isSpeaker =
			room.state.phase === "round-active" &&
			room.state.turnQueue[room.state.currentTurnIdx]?.speakerUserId ===
				viewerUserId;
		if (!isSpeaker) {
			return {
				...room,
				state: { ...room.state, currentWord: null },
			};
		}
		return room;
	}
	if (room.game === "papers") {
		const masked: typeof room.state.assignments = {};
		for (const [uid, a] of Object.entries(room.state.assignments)) {
			if (uid === viewerUserId) {
				masked[uid] = { from: a.from, word: null };
			} else {
				masked[uid] = a;
			}
		}
		return { ...room, state: { ...room.state, assignments: masked } };
	}
	return room;
}

export function broadcastRoom(roomId: string) {
	const room = readRoom(roomId);
	if (!room) return;
	for (const peer of getPeersInRoom(roomId)) {
		const masked = maskRoomForUser(room, peer.userId);
		peer.send(
			JSON.stringify({ type: "state", room: masked }),
		);
	}
}

export function sendToPeer(peerId: string, payload: any) {
	const peer = peers.get(peerId);
	if (!peer) return;
	peer.send(JSON.stringify(payload));
}

export function getPeer(peerId: string): Peer | undefined {
	return peers.get(peerId);
}
