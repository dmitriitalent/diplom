import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { STATICFILES_DIR, ensureStaticfilesDir } from "./staticfiles";
import { maybeCompressImage } from "./imageCompression";

export const ACTIVITY_GALLERY_DIR: string = path.join(
	STATICFILES_DIR,
	"activity-gallery",
);

export type PhotoMeta = {
	id: string;
	ext: string;
	width: number;
	height: number;
	uploadedBy: string;
	uploadedAt: string;
};

export type GalleryIndex = {
	photos: PhotoMeta[];
};

function ensureBase(): void {
	ensureStaticfilesDir();
	if (!fs.existsSync(ACTIVITY_GALLERY_DIR)) {
		fs.mkdirSync(ACTIVITY_GALLERY_DIR, { recursive: true });
	}
}

function isSafeId(id: string): boolean {
	return /^[A-Za-z0-9_-]{1,80}$/.test(id);
}

export function activityDir(activityId: string): string {
	return path.join(ACTIVITY_GALLERY_DIR, activityId);
}

export function ensureActivityDir(activityId: string): string {
	ensureBase();
	const dir = activityDir(activityId);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	return dir;
}

export function readIndex(activityId: string): GalleryIndex {
	if (!isSafeId(activityId)) return { photos: [] };
	const dir = activityDir(activityId);
	const fp = path.join(dir, "index.json");
	if (!fs.existsSync(fp)) return { photos: [] };
	try {
		return JSON.parse(fs.readFileSync(fp, "utf-8")) as GalleryIndex;
	} catch {
		return { photos: [] };
	}
}

export function writeIndex(activityId: string, idx: GalleryIndex): void {
	ensureActivityDir(activityId);
	fs.writeFileSync(
		path.join(activityDir(activityId), "index.json"),
		JSON.stringify(idx, null, 2),
		"utf-8",
	);
}

export function findPhotoFile(
	activityId: string,
	photoId: string,
): string | null {
	if (!isSafeId(activityId) || !isSafeId(photoId)) return null;
	const dir = activityDir(activityId);
	if (!fs.existsSync(dir)) return null;
	for (const f of fs.readdirSync(dir)) {
		const ext = path.extname(f);
		const base = f.slice(0, f.length - ext.length);
		if (base === photoId) return path.join(dir, f);
	}
	return null;
}

export function deletePhotoFile(
	activityId: string,
	photoId: string,
): void {
	const fp = findPhotoFile(activityId, photoId);
	if (fp && fs.existsSync(fp)) fs.unlinkSync(fp);
}

export function genPhotoId(): string {
	return (
		Date.now().toString(36) +
		Math.random().toString(36).slice(2, 8)
	);
}

export async function savePhoto(
	activityId: string,
	uploadedBy: string,
	fileBuffer: Buffer,
	mime: string,
	originalName: string,
): Promise<PhotoMeta> {
	if (!isSafeId(activityId)) {
		throw new Error("Invalid activityId");
	}
	const compressed = await maybeCompressImage(
		fileBuffer,
		mime,
		originalName,
	);
	const meta = await sharp(compressed.buffer, { failOn: "none" })
		.metadata()
		.catch(() => ({ width: 0, height: 0 }) as { width?: number; height?: number });

	const id = genPhotoId();
	const ext = compressed.extension || "bin";

	ensureActivityDir(activityId);
	fs.writeFileSync(
		path.join(activityDir(activityId), `${id}.${ext}`),
		compressed.buffer,
	);

	const photoMeta: PhotoMeta = {
		id,
		ext,
		width: meta.width ?? 0,
		height: meta.height ?? 0,
		uploadedBy,
		uploadedAt: new Date().toISOString(),
	};

	const idx = readIndex(activityId);
	idx.photos.push(photoMeta);
	writeIndex(activityId, idx);

	return photoMeta;
}

export function removePhoto(
	activityId: string,
	photoId: string,
): boolean {
	const idx = readIndex(activityId);
	const i = idx.photos.findIndex((p) => p.id === photoId);
	if (i === -1) return false;
	idx.photos.splice(i, 1);
	writeIndex(activityId, idx);
	deletePhotoFile(activityId, photoId);
	if (idx.photos.length === 0) {
		const dir = activityDir(activityId);
		try {
			const left = fs.readdirSync(dir);
			if (left.length === 0) fs.rmdirSync(dir);
		} catch {}
	}
	return true;
}
