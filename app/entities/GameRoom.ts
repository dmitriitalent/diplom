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

export type AliasTurnSlot = {
	teamIdx: number;
	speakerUserId: string;
};

export type AliasRoundEntry = {
	word: string;
	status: "guessed" | "skipped";
};

export type AliasPhase =
	| "lobby"
	| "round-pre"
	| "round-active"
	| "round-result"
	| "finished";

export type AliasState = {
	phase: AliasPhase;
	teams: AliasTeam[];
	currentTurnIdx: number;
	turnQueue: AliasTurnSlot[];
	currentWord: string | null;
	roundEndsAt: number | null;
	roundEntries: AliasRoundEntry[];
	usedWords: string[];
	wordPool: string[];
	winnerTeamIdx: number | null;
};

export type PapersAssignment = {
	from: string | null;
	word: string | null;
};

export type PapersPhase = "lobby" | "assigning" | "playing" | "finished";

export type PapersState = {
	phase: PapersPhase;
	assignTargets: Record<string, string>;
	assignments: Record<string, PapersAssignment>;
	finishedPlayers: string[];
	turnQueue: string[];
	currentTurnIdx: number;
};

export type RoomStatus = "lobby" | "playing" | "finished";

type RoomBase = {
	id: string;
	code: string;
	hostId: string;
	createdAt: string;
	updatedAt: string;
	status: RoomStatus;
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

export type DictEntry = {
	id: string;
	name: string;
	count: number;
};

export type DictsManifest = {
	ru: DictEntry[];
	en: DictEntry[];
};

export type ClientMessage =
	| { type: "join-room"; roomId: string }
	| { type: "leave-room"; roomId: string }
	| {
			type: "settings-update";
			settings: Partial<AliasSettings> | Partial<PapersSettings>;
	  }
	| { type: "start-game" }
	| { type: "alias-start-turn" }
	| { type: "alias-action"; action: "guessed" | "skipped" }
	| { type: "alias-end-round" }
	| { type: "alias-next-turn" }
	| { type: "papers-assign-word"; word: string }
	| { type: "papers-finish-player"; userId: string }
	| { type: "papers-new-word"; userId: string }
	| { type: "new-game" }
	| { type: "kick"; userId: string };

export type ServerMessage =
	| { type: "state"; room: Room }
	| { type: "error"; message: string };
