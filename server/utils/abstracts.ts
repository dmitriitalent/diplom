import fs from "node:fs";
import path from "node:path";
import { STATICFILES_DIR, ensureStaticfilesDir } from "./staticfiles";

export const ABSTRACTS_DIR: string = path.join(
	STATICFILES_DIR,
	"abstracts",
);

export type AbstractType = "lecture" | "lab";

export type AbstractFile = {
	id: string;
	type: AbstractType;
	title: string;
	subject: string;
	description: string;
	imageIds: Array<string>;
	authorId: string;
	likes: Array<string>;
	createdAt: string;
	updatedAt: string;
};

export function ensureAbstractsDir(): void {
	ensureStaticfilesDir();
	if (!fs.existsSync(ABSTRACTS_DIR)) {
		fs.mkdirSync(ABSTRACTS_DIR, { recursive: true });
	}
}

export function listAbstractIds(): number[] {
	ensureAbstractsDir();
	return fs
		.readdirSync(ABSTRACTS_DIR)
		.filter((f) => f.endsWith(".json"))
		.map((f) => parseInt(f.slice(0, -5), 10))
		.filter((n) => Number.isFinite(n))
		.sort((a, b) => a - b);
}

export function readAbstract(
	id: number | string,
): AbstractFile | null {
	ensureAbstractsDir();
	const fp = path.join(ABSTRACTS_DIR, `${id}.json`);
	if (!fs.existsSync(fp)) return null;
	try {
		return JSON.parse(fs.readFileSync(fp, "utf-8")) as AbstractFile;
	} catch {
		return null;
	}
}

export function writeAbstract(
	id: number | string,
	data: AbstractFile,
): void {
	ensureAbstractsDir();
	fs.writeFileSync(
		path.join(ABSTRACTS_DIR, `${id}.json`),
		JSON.stringify(data, null, 2),
		"utf-8",
	);
}

export function deleteAbstractFile(id: number | string): boolean {
	ensureAbstractsDir();
	const fp = path.join(ABSTRACTS_DIR, `${id}.json`);
	if (!fs.existsSync(fp)) return false;
	fs.unlinkSync(fp);
	return true;
}

export function nextAbstractId(): number {
	const ids = listAbstractIds();
	if (ids.length === 0) return 1;
	const last = ids[ids.length - 1] ?? 0;
	return last + 1;
}
