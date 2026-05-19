import { ref, shallowRef, onBeforeUnmount, type Ref, type ShallowRef } from "vue";
import type { ClientMessage, Room, ServerMessage } from "~/entities/GameRoom";

export type UseGameRoomReturn = {
	room: ShallowRef<Room | null>;
	connected: Ref<boolean>;
	error: Ref<string | null>;
	send: (payload: ClientMessage) => void;
	leave: () => void;
	disconnect: () => void;
};

export function useGameRoom(roomId: string): UseGameRoomReturn {
	const room = shallowRef<Room | null>(null);
	const connected = ref(false);
	const error = ref<string | null>(null);

	let ws: WebSocket | null = null;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let stopped = false;

	const send = (payload: ClientMessage): void => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(payload));
		}
	};

	const connect = (): void => {
		if (typeof window === "undefined") return;
		const proto = window.location.protocol === "https:" ? "wss" : "ws";
		const url = `${proto}://${window.location.host}/ws/games`;
		ws = new WebSocket(url);

		ws.onopen = () => {
			connected.value = true;
			error.value = null;
			send({ type: "join-room", roomId });
		};

		ws.onmessage = (e: MessageEvent) => {
			try {
				const msg = JSON.parse(String(e.data)) as ServerMessage;
				if (msg.type === "state") {
					room.value = msg.room;
				} else if (msg.type === "error") {
					error.value = msg.message;
				}
			} catch {}
		};

		ws.onclose = () => {
			connected.value = false;
			if (stopped) return;
			reconnectTimer = setTimeout(connect, 1500);
		};

		ws.onerror = () => {
			try {
				ws?.close();
			} catch {}
		};
	};

	const leave = (): void => {
		send({ type: "leave-room", roomId });
	};

	const disconnect = (): void => {
		stopped = true;
		if (reconnectTimer) clearTimeout(reconnectTimer);
		try {
			ws?.close();
		} catch {}
		ws = null;
	};

	onBeforeUnmount(disconnect);
	connect();

	return { room, connected, error, send, leave, disconnect };
}
