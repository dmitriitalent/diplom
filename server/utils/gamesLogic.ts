import {
	loadDict,
	makeAliasInitialState,
	makePapersInitialState,
	pickRandomWord,
	shuffleInPlace,
	writeRoom,
	type AliasRoom,
	type PapersRoom,
	type Room,
} from "./games";

export function startAlias(room: AliasRoom): string | null {
	if (room.players.length < 4) return "Минимум 4 игрока";
	if (room.players.length % 2 !== 0) return "Нужно чётное количество игроков";

	const players = shuffleInPlace([...room.players]);
	const teams: AliasRoom["state"]["teams"] = [];
	for (let i = 0; i < players.length; i += 2) {
		const a = players[i]!;
		const b = players[i + 1]!;
		teams.push({
			id: i / 2,
			name: `Команда ${i / 2 + 1}`,
			playerIds: [a.userId, b.userId],
			score: 0,
		});
	}

	const turnQueue: AliasRoom["state"]["turnQueue"] = [];
	const speakerSlot: Record<number, number> = {};
	const maxRounds = 200;
	for (let r = 0; r < maxRounds; r++) {
		for (let t = 0; t < teams.length; t++) {
			const team = teams[t]!;
			const slot = speakerSlot[t] ?? 0;
			turnQueue.push({
				teamIdx: t,
				speakerUserId: team.playerIds[slot % team.playerIds.length]!,
			});
			speakerSlot[t] = slot + 1;
		}
	}

	const words = loadDict(room.settings.lang, room.settings.dictionary);
	const pool = shuffleInPlace([...words]);

	room.status = "playing";
	room.state = {
		...makeAliasInitialState(),
		teams,
		turnQueue,
		wordPool: pool,
		phase: "round-pre",
	};
	room.updatedAt = new Date().toISOString();
	writeRoom(room);
	return null;
}

export function aliasStartRound(room: AliasRoom): string | null {
	if (room.state.phase !== "round-pre" && room.state.phase !== "round-result") {
		return "Раунд уже идёт";
	}
	const next = room.state.wordPool.pop();
	if (!next) {
		const words = loadDict(room.settings.lang, room.settings.dictionary);
		room.state.wordPool = shuffleInPlace(
			words.filter((w) => !room.state.usedWords.includes(w)),
		);
		room.state.currentWord = room.state.wordPool.pop() ?? null;
	} else {
		room.state.currentWord = next;
	}
	room.state.roundEntries = [];
	room.state.roundEndsAt = Date.now() + room.settings.roundTime * 1000;
	room.state.phase = "round-active";
	room.updatedAt = new Date().toISOString();
	writeRoom(room);
	return null;
}

export function aliasAction(
	room: AliasRoom,
	action: "guessed" | "skipped",
): string | null {
	if (room.state.phase !== "round-active") return "Раунд не идёт";
	const word = room.state.currentWord;
	if (!word) return "Нет слова";

	room.state.roundEntries.push({ word, status: action });
	room.state.usedWords.push(word);

	const turn = room.state.turnQueue[room.state.currentTurnIdx];
	if (!turn) return "Нет хода";
	const team = room.state.teams[turn.teamIdx];
	if (!team) return "Команда не найдена";

	if (action === "guessed") {
		team.score += 1;
	} else if (action === "skipped" && room.settings.skipPenalty) {
		team.score = Math.max(0, team.score - 1);
	}

	if (Date.now() >= (room.state.roundEndsAt ?? 0)) {
		return aliasEndRound(room);
	}

	const next = room.state.wordPool.pop();
	if (!next) {
		const words = loadDict(room.settings.lang, room.settings.dictionary);
		room.state.wordPool = shuffleInPlace(
			words.filter((w) => !room.state.usedWords.includes(w)),
		);
		room.state.currentWord = room.state.wordPool.pop() ?? null;
	} else {
		room.state.currentWord = next;
	}
	room.updatedAt = new Date().toISOString();
	writeRoom(room);
	return null;
}

export function aliasEndRound(room: AliasRoom): string | null {
	room.state.phase = "round-result";
	room.state.currentWord = null;
	room.state.roundEndsAt = null;

	const winner = room.state.teams.find(
		(t) => t.score >= room.settings.scoreToWin,
	);
	if (winner) {
		room.state.phase = "finished";
		room.state.winnerTeamIdx = winner.id;
		room.status = "finished";
	}
	room.updatedAt = new Date().toISOString();
	writeRoom(room);
	return null;
}

export function aliasNextTurn(room: AliasRoom): string | null {
	if (room.state.phase !== "round-result") return "Раунд ещё не закончен";
	room.state.currentTurnIdx += 1;
	if (room.state.currentTurnIdx >= room.state.turnQueue.length) {
		room.state.currentTurnIdx = 0;
	}
	room.state.phase = "round-pre";
	room.updatedAt = new Date().toISOString();
	writeRoom(room);
	return null;
}

export function startPapers(room: PapersRoom): string | null {
	if (room.players.length < 3) return "Минимум 3 игрока";

	const ids = room.players.map((p) => p.userId);
	const shuffled = shuffleInPlace([...ids]);

	const assignments: PapersRoom["state"]["assignments"] = {};
	const assignTargets: PapersRoom["state"]["assignTargets"] = {};

	for (let i = 0; i < shuffled.length; i++) {
		const writer = shuffled[i]!;
		const target = shuffled[(i + 1) % shuffled.length]!;
		assignTargets[writer] = target;
	}

	if (room.settings.mode === "auto") {
		const words = loadDict(room.settings.lang, room.settings.dictionary);
		const pool = shuffleInPlace([...words]);
		for (const target of ids) {
			assignments[target] = {
				from: null,
				word: pool.pop() ?? "слово",
			};
		}
		room.state = {
			...makePapersInitialState(),
			phase: "playing",
			assignTargets: {},
			assignments,
			turnQueue: shuffleInPlace([...ids]),
		};
		room.status = "playing";
	} else {
		room.state = {
			...makePapersInitialState(),
			phase: "assigning",
			assignTargets,
			assignments: {},
		};
		room.status = "playing";
	}
	room.updatedAt = new Date().toISOString();
	writeRoom(room);
	return null;
}

export function papersSubmitWord(
	room: PapersRoom,
	writerUserId: string,
	word: string,
): string | null {
	if (room.state.phase !== "assigning") return "Не время задавать слово";
	const target = room.state.assignTargets[writerUserId];
	if (!target) return "Для тебя не задана цель";
	const w = word.trim();
	if (!w) return "Слово не может быть пустым";
	room.state.assignments[target] = { from: writerUserId, word: w };

	const remaining = Object.keys(room.state.assignTargets).filter(
		(uid) => {
			const t = room.state.assignTargets[uid]!;
			return !room.state.assignments[t];
		},
	);
	if (remaining.length === 0) {
		room.state.phase = "playing";
		room.state.turnQueue = shuffleInPlace(
			room.players.map((p) => p.userId),
		);
		room.state.currentTurnIdx = 0;
	}
	room.updatedAt = new Date().toISOString();
	writeRoom(room);
	return null;
}

export function papersFinishPlayer(
	room: PapersRoom,
	userId: string,
): string | null {
	if (room.state.phase !== "playing") return "Игра не идёт";
	if (!room.state.finishedPlayers.includes(userId)) {
		room.state.finishedPlayers.push(userId);
	}
	papersAdvanceTurn(room);
	const active = room.state.turnQueue.filter(
		(uid) => !room.state.finishedPlayers.includes(uid),
	);
	if (active.length === 0) {
		room.state.phase = "finished";
		room.status = "finished";
	}
	room.updatedAt = new Date().toISOString();
	writeRoom(room);
	return null;
}

export function papersNewWord(
	room: PapersRoom,
	userId: string,
): string | null {
	if (room.state.phase !== "playing") return "Игра не идёт";
	const word = pickRandomWord(room.settings.lang, room.settings.dictionary);
	const prev = room.state.assignments[userId];
	room.state.assignments[userId] = {
		from: prev?.from ?? null,
		word: word ?? "слово",
	};
	papersAdvanceTurn(room);
	room.updatedAt = new Date().toISOString();
	writeRoom(room);
	return null;
}

export function papersAdvanceTurn(room: PapersRoom): void {
	if (room.state.turnQueue.length === 0) return;
	const total = room.state.turnQueue.length;
	for (let step = 1; step <= total; step++) {
		const idx = (room.state.currentTurnIdx + step) % total;
		const uid = room.state.turnQueue[idx]!;
		if (!room.state.finishedPlayers.includes(uid)) {
			room.state.currentTurnIdx = idx;
			return;
		}
	}
}

export function resetRoomToLobby(room: Room): void {
	room.status = "lobby";
	if (room.game === "alias") {
		room.state = makeAliasInitialState();
	} else {
		room.state = makePapersInitialState();
	}
	room.updatedAt = new Date().toISOString();
	writeRoom(room);
}
