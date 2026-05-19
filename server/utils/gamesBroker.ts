import type {
	PapersAssignment,
	Room,
	ServerMessage,
} from "~~/app/entities/GameRoom";
import { readRoom, writeRoom, deleteRoom } from "./games";

export type BrokerPeer = {
	id: string;
	userId: string;
	roomId: string | null;
	send: (data: string) => void;
};

const peers = new Map<string, BrokerPeer>();
const roomPeers = new Map<string, Set<string>>();
const cleanupTimers = new Map<string, NodeJS.Timeout>();

const GRACE_MS = 30000;

export function registerPeer(peer: BrokerPeer): void {
	peers.set(peer.id, peer);
}

export function unregisterPeer(peerId: string): void {
	const peer = peers.get(peerId);
	if (!peer) return;
	if (peer.roomId) leaveRoom(peerId, peer.roomId);
	peers.delete(peerId);
}

export function joinRoom(peerId: string, roomId: string): void {
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

export function leaveRoom(peerId: string, roomId: string): void {
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

export function scheduleCleanupIfEmpty(roomId: string): void {
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

export function getPeersInRoom(roomId: string): BrokerPeer[] {
	const set = roomPeers.get(roomId);
	if (!set) return [];

	const out: BrokerPeer[] = [];
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
	const masked: Record<string, PapersAssignment> = {};
	for (const [uid, a] of Object.entries(room.state.assignments)) {
		if (uid === viewerUserId) {
			masked[uid] = { from: a.from, word: null };
		} else {
			masked[uid] = a;
		}
	}
	return { ...room, state: { ...room.state, assignments: masked } };
}

export function broadcastRoom(roomId: string): void {
	const room = readRoom(roomId);
	if (!room) return;

	for (const peer of getPeersInRoom(roomId)) {
		const masked = maskRoomForUser(room, peer.userId);
		const payload: ServerMessage = { type: "state", room: masked };
		peer.send(JSON.stringify(payload));
	}
}

export function sendToPeer(peerId: string, payload: ServerMessage): void {
	const peer = peers.get(peerId);
	if (!peer) return;

	peer.send(JSON.stringify(payload));
}

export function getPeer(peerId: string): BrokerPeer | undefined {
	return peers.get(peerId);
}
