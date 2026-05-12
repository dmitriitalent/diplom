import fs from "node:fs";
import path from "node:path";

/** Папка хранения файлов — <cwd>/staticfiles/ */
export const STATICFILES_DIR = path.resolve(process.cwd(), "staticfiles");

/** Создаёт папку, если её нет */
export function ensureStaticfilesDir() {
	if (!fs.existsSync(STATICFILES_DIR)) {
		fs.mkdirSync(STATICFILES_DIR, { recursive: true });
	}
}

/** Возвращает полный путь к файлу по ключу (или null, если не найден) */
export function findFileByKey(key: string): string | null {
	ensureStaticfilesDir();
	const files = fs.readdirSync(STATICFILES_DIR);
	const found = files.find((f) => {
		const ext = path.extname(f);
		const base = f.slice(0, f.length - ext.length);
		return base === key;
	});
	return found ? path.join(STATICFILES_DIR, found) : null;
}

/** Удаляет все файлы с данным ключом (разные расширения) */
export function deleteFilesByKey(key: string): void {
	ensureStaticfilesDir();
	const files = fs.readdirSync(STATICFILES_DIR);
	for (const f of files) {
		const ext = path.extname(f);
		const base = f.slice(0, f.length - ext.length);
		if (base === key) {
			fs.unlinkSync(path.join(STATICFILES_DIR, f));
		}
	}
}

/** Возвращает расширение по MIME-типу */
export function extByMime(mime: string): string {
	const map: Record<string, string> = {
		"image/jpeg": ".jpg",
		"image/png": ".png",
		"image/gif": ".gif",
		"image/webp": ".webp",
		"image/svg+xml": ".svg",
		"image/avif": ".avif",
	};
	return map[mime] ?? ".bin";
}

/** MIME-тип по расширению */
export function mimeByExt(ext: string): string {
	const map: Record<string, string> = {
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".png": "image/png",
		".gif": "image/gif",
		".webp": "image/webp",
		".svg": "image/svg+xml",
		".avif": "image/avif",
	};
	return map[ext.toLowerCase()] ?? "application/octet-stream";
}

/** Декодирует JWT-payload из cookie «accessToken» и возвращает объект или null */
export function decodeAccessToken(cookie: string | undefined): Record<string, any> | null {
	if (!cookie) return null;
	const entry = cookie.split(";").find((c) => c.trim().startsWith("accessToken="));
	if (!entry) return null;
	const token = entry.trim().slice("accessToken=".length);
	try {
		const payloadB64 = token.split(".")[1];
		if (!payloadB64) return null;
		return JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
	} catch {
		return null;
	}
}

/** Проверяет, что пользователь — администратор */
export function isAdmin(cookie: string | undefined): boolean {
	const payload = decodeAccessToken(cookie);
	return Array.isArray(payload?.roles) && payload.roles.includes("ADMIN");
}
