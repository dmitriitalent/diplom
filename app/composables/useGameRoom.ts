import { ref, shallowRef, onBeforeUnmount } from "vue";

export type GameRoomState = any;

export function useGameRoom(roomId: string) {
	const room = shallowRef<GameRoomState | null>(null);
	const connected = ref(false);
	const error = ref<string | null>(null);

	let ws: WebSocket | null = null;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let stopped = false;

	const send = (payload: any) => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(payload));
		}
	};

	const connect = () => {
		if (typeof window === "undefined") return;
		const proto = window.location.protocol === "https:" ? "wss" : "ws";
		const url = `${proto}://${window.location.host}/ws/games`;
		ws = new WebSocket(url);

		ws.onopen = () => {
			connected.value = true;
			error.value = null;
			send({ type: "join-room", roomId });
		};

		ws.onmessage = (e) => {
			try {
				const msg = JSON.parse(e.data);
				if (msg.type === "state" && msg.room) {
					room.value = msg.room;
				} else if (msg.type === "error") {
					error.value = msg.message ?? "Ошибка";
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

	const leave = () => {
		send({ type: "leave-room", roomId });
	};

	const disconnect = () => {
		stopped = true;
		if (reconnectTimer) clearTimeout(reconnectTimer);
		try {
			ws?.close();
		} catch {}
		ws = null;
	};

	onBeforeUnmount(() => {
		disconnect();
	});

	connect();

	return { room, connected, error, send, leave, disconnect };
}
