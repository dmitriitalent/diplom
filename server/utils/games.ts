import fs from "node:fs";
import path from "node:path";
import { STATICFILES_DIR, ensureStaticfilesDir } from "./staticfiles";

export const GAMES_DIR = path.join(STATICFILES_DIR, "games");
export const ROOMS_DIR = path.join(GAMES_DIR, "rooms");
export const CODES_DIR = path.join(GAMES_DIR, "codes");
export const DICTS_DIR = path.join(GAMES_DIR, "dicts");

export type Lang = "ru" | "en";

export type Player = {
	userId: string;
	name: string;
	surname: string;
	online: boolean;
	joinedAt: string;
};

export type AliasSettings = {
	lang: Lang;
	dictionary: string;
	roundTime: number;
	scoreToWin: number;
	skipPenalty: boolean;
};

export type PapersSettings = {
	mode: "auto" | "manual";
	lang: Lang;
	dictionary: string;
};

export type AliasTeam = {
	id: number;
	name: string;
	playerIds: string[];
	score: number;
};

export type AliasState = {
	phase:
		| "lobby"
		| "round-pre"
		| "round-active"
		| "round-result"
		| "finished";
	teams: AliasTeam[];
	currentTurnIdx: number;
	turnQueue: Array<{ teamIdx: number; speakerUserId: string }>;
	currentWord: string | null;
	roundEndsAt: number | null;
	roundEntries: Array<{ word: string; status: "guessed" | "skipped" }>;
	usedWords: string[];
	wordPool: string[];
	winnerTeamIdx: number | null;
};

export type PapersAssignment = {
	from: string | null;
	word: string | null;
};

export type PapersState = {
	phase: "lobby" | "assigning" | "playing" | "finished";
	assignTargets: Record<string, string>;
	assignments: Record<string, PapersAssignment>;
	finishedPlayers: string[];
	turnQueue: string[];
	currentTurnIdx: number;
};

export type RoomBase = {
	id: string;
	code: string;
	hostId: string;
	createdAt: string;
	updatedAt: string;
	status: "lobby" | "playing" | "finished";
	players: Player[];
};

export type AliasRoom = RoomBase & {
	game: "alias";
	settings: AliasSettings;
	state: AliasState;
};

export type PapersRoom = RoomBase & {
	game: "papers";
	settings: PapersSettings;
	state: PapersState;
};

export type Room = AliasRoom | PapersRoom;

export function ensureGamesDirs() {
	ensureStaticfilesDir();
	for (const d of [GAMES_DIR, ROOMS_DIR, CODES_DIR]) {
		if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
	}
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function genInviteCode(): string {
	let out = "";
	for (let i = 0; i < 8; i++) {
		out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
	}
	return out;
}

export function genUniqueCode(): string {
	ensureGamesDirs();
	for (let i = 0; i < 20; i++) {
		const code = genInviteCode();
		if (!fs.existsSync(path.join(CODES_DIR, `${code}.json`))) return code;
	}
	throw new Error("Could not generate unique code");
}

export function genRoomId(): string {
	return (
		Date.now().toString(36) +
		Math.random().toString(36).slice(2, 8)
	);
}

export function readRoom(id: string): Room | null {
	ensureGamesDirs();
	const fp = path.join(ROOMS_DIR, `${id}.json`);
	if (!fs.existsSync(fp)) return null;
	try {
		return JSON.parse(fs.readFileSync(fp, "utf-8")) as Room;
	} catch {
		return null;
	}
}

export function writeRoom(room: Room): void {
	ensureGamesDirs();
	fs.writeFileSync(
		path.join(ROOMS_DIR, `${room.id}.json`),
		JSON.stringify(room, null, 2),
		"utf-8",
	);
}

export function deleteRoom(id: string): void {
	ensureGamesDirs();
	const room = readRoom(id);
	const fp = path.join(ROOMS_DIR, `${id}.json`);
	if (fs.existsSync(fp)) fs.unlinkSync(fp);
	if (room?.code) {
		const cp = path.join(CODES_DIR, `${room.code}.json`);
		if (fs.existsSync(cp)) fs.unlinkSync(cp);
	}
}

export function resolveCode(code: string): string | null {
	ensureGamesDirs();
	const fp = path.join(CODES_DIR, `${code.toUpperCase()}.json`);
	if (!fs.existsSync(fp)) return null;
	try {
		const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
		return data.roomId ?? null;
	} catch {
		return null;
	}
}

export function writeCode(code: string, roomId: string): void {
	ensureGamesDirs();
	fs.writeFileSync(
		path.join(CODES_DIR, `${code}.json`),
		JSON.stringify({ roomId }),
		"utf-8",
	);
}

const dictCache = new Map<string, string[]>();

export function loadDict(lang: Lang, dictionary: string): string[] {
	const key = `${lang}/${dictionary}`;
	const cached = dictCache.get(key);
	if (cached) return cached;
	const fp = path.join(DICTS_DIR, lang, `${dictionary}.json`);
	if (!fs.existsSync(fp)) return [];
	try {
		const words = JSON.parse(fs.readFileSync(fp, "utf-8")) as string[];
		dictCache.set(key, words);
		return words;
	} catch {
		return [];
	}
}

export function loadDictsManifest(): {
	ru: Array<{ id: string; name: string; count: number }>;
	en: Array<{ id: string; name: string; count: number }>;
} {
	const fp = path.join(DICTS_DIR, "index.json");
	if (!fs.existsSync(fp)) return { ru: [], en: [] };
	try {
		return JSON.parse(fs.readFileSync(fp, "utf-8"));
	} catch {
		return { ru: [], en: [] };
	}
}

export function shuffleInPlace<T>(arr: T[]): T[] {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j]!, arr[i]!];
	}
	return arr;
}

export function pickRandomWord(lang: Lang, dictionary: string): string | null {
	const words = loadDict(lang, dictionary);
	if (words.length === 0) return null;
	return words[Math.floor(Math.random() * words.length)] ?? null;
}

export function makeAliasInitialState(): AliasState {
	return {
		phase: "lobby",
		teams: [],
		currentTurnIdx: 0,
		turnQueue: [],
		currentWord: null,
		roundEndsAt: null,
		roundEntries: [],
		usedWords: [],
		wordPool: [],
		winnerTeamIdx: null,
	};
}

export function makePapersInitialState(): PapersState {
	return {
		phase: "lobby",
		assignTargets: {},
		assignments: {},
		finishedPlayers: [],
		turnQueue: [],
		currentTurnIdx: 0,
	};
}
