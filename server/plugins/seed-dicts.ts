import fs from "node:fs";
import path from "node:path";
import { DICTS_DIR } from "~~/server/utils/games";

/**
 * Сидирование словарей для игр при старте сервера.
 *
 * Словари лежат в staticfiles/games/dicts, но эта папка — рантайм-данные:
 * в рабочий контейнер она не попадает (Dockerfile копирует только .output,
 * а сам staticfiles на сервере может быть пустым volume). Поэтому при сборке
 * словари кладутся в образ по пути <cwd>/dicts-seed (см. Dockerfile), а здесь,
 * при старте Nitro, копируются в DICTS_DIR, если их там ещё нет.
 *
 * Если словари уже на месте (например, примонтированы) — ничего не делаем.
 */
export default defineNitroPlugin(() => {
	try {
		const manifestPath = path.join(DICTS_DIR, "index.json");

		// Уже есть непустой манифест — словари на месте, сид не нужен.
		if (fs.existsSync(manifestPath)) {
			try {
				const m = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
				const ru = Array.isArray(m?.ru) ? m.ru.length : 0;
				const en = Array.isArray(m?.en) ? m.en.length : 0;
				if (ru + en > 0) return;
			} catch {
				// битый манифест — пересидируем
			}
		}

		const seedDir = path.resolve(process.cwd(), "dicts-seed");
		if (!fs.existsSync(seedDir)) {
			console.log("[seed-dicts] seed directory not found, skip:", seedDir);
			return;
		}

		fs.mkdirSync(DICTS_DIR, { recursive: true });
		fs.cpSync(seedDir, DICTS_DIR, { recursive: true });
		console.log("[seed-dicts] game dictionaries seeded into", DICTS_DIR);
	} catch (err) {
		console.log("[seed-dicts] failed to seed dictionaries:", err);
	}
});
