import fs from "node:fs";
import path from "node:path";
import { STATICFILES_DIR, ensureStaticfilesDir } from "./staticfiles";

export const ACTIVITY_MUSIC_DIR: string = path.join(
	STATICFILES_DIR,
	"activity-music",
);

export type Track = {
	id: string;
	title: string;
	author: string;
	link: string;
	cover: string;
	addedBy: string;
	addedAt: string;
};

export type MusicFile = {
	tracks: Track[];
};

function ensureBase(): void {
	ensureStaticfilesDir();
	if (!fs.existsSync(ACTIVITY_MUSIC_DIR)) {
		fs.mkdirSync(ACTIVITY_MUSIC_DIR, { recursive: true });
	}
}

function isSafeId(id: string): boolean {
	return /^[A-Za-z0-9_-]{1,80}$/.test(id);
}

function filePath(activityId: string): string {
	return path.join(ACTIVITY_MUSIC_DIR, `${activityId}.json`);
}

export function readMusic(activityId: string): MusicFile {
	if (!isSafeId(activityId)) return { tracks: [] };
	ensureBase();
	const fp = filePath(activityId);
	if (!fs.existsSync(fp)) return { tracks: [] };
	try {
		return JSON.parse(fs.readFileSync(fp, "utf-8")) as MusicFile;
	} catch {
		return { tracks: [] };
	}
}

export function writeMusic(activityId: string, data: MusicFile): void {
	if (!isSafeId(activityId)) return;
	ensureBase();
	fs.writeFileSync(
		filePath(activityId),
		JSON.stringify(data, null, 2),
		"utf-8",
	);
}

export function genTrackId(): string {
	return (
		Date.now().toString(36) +
		Math.random().toString(36).slice(2, 8)
	);
}

export function addTrack(
	activityId: string,
	track: Omit<Track, "id" | "addedAt">,
): Track {
	const data = readMusic(activityId);
	const t: Track = {
		id: genTrackId(),
		title: track.title.trim(),
		author: track.author.trim(),
		link: track.link.trim(),
		cover: track.cover.trim(),
		addedBy: track.addedBy,
		addedAt: new Date().toISOString(),
	};
	data.tracks.push(t);
	writeMusic(activityId, data);
	return t;
}

export function removeTrack(
	activityId: string,
	trackId: string,
): Track | null {
	const data = readMusic(activityId);
	const i = data.tracks.findIndex((t) => t.id === trackId);
	if (i === -1) return null;
	const [removed] = data.tracks.splice(i, 1);
	if (data.tracks.length === 0) {
		const fp = filePath(activityId);
		if (fs.existsSync(fp)) fs.unlinkSync(fp);
	} else {
		writeMusic(activityId, data);
	}
	return removed ?? null;
}
