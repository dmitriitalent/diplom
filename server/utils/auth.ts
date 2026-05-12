import axios from "axios";
import type { H3Event } from "h3";

export type Role = "USER" | "VERIFIED_RESIDENT" | "COMMANDANT" | "ADMIN";

const ROLE_LEVELS: Record<Role, number> = {
	USER: 0,
	VERIFIED_RESIDENT: 1,
	COMMANDANT: 2,
	ADMIN: 3,
};

/** Декодирует JWT из cookie «accessToken» (если есть) и возвращает payload или null */
export function decodeJwt(cookie: string | undefined): Record<string, any> | null {
	if (!cookie) return null;
	const entry = cookie.split(";").find((c) => c.trim().startsWith("accessToken="));
	if (!entry) return null;
	const token = entry.trim().slice("accessToken=".length);
	try {
		const payload = token.split(".")[1];
		if (!payload) return null;
		return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
	} catch {
		return null;
	}
}

export function getRoles(cookie: string | undefined): string[] {
	const payload = decodeJwt(cookie);
	return Array.isArray(payload?.roles) ? (payload!.roles as string[]) : [];
}

/** true, если в JWT есть роль не ниже `min` */
export function hasAtLeastRole(cookie: string | undefined, min: Role): boolean {
	const roles = getRoles(cookie);
	let max = 0;
	for (const r of roles) {
		const lvl = (ROLE_LEVELS as Record<string, number | undefined>)[r];
		if (typeof lvl === "number" && lvl > max) max = lvl;
	}
	return max >= ROLE_LEVELS[min];
}

/** Жёсткая проверка: ниже min — бросает 403 */
export function ensureRole(event: H3Event, min: Role): void {
	const cookie = getHeader(event, "cookie");
	if (hasAtLeastRole(cookie, min)) return;
	throw createError({
		statusCode: 403,
		statusMessage: "Forbidden",
		message: `Role ${min} or higher is required`,
	});
}

/** Очищает access/refresh куки на ответе. Запросом к бэкенду /auth/logout не дёргаем. */
function clearAuthCookies(event: H3Event) {
	setCookie(event, "accessToken", "", { maxAge: 0, path: "/" });
	setCookie(event, "refreshToken", "", { maxAge: 0, path: "/" });
}

/**
 * Гарантирует, что текущий пользователь верифицирован.
 * Сценарии:
 *  - В JWT уже есть `VERIFIED_RESIDENT` или выше → пропускаем.
 *  - JWT-роли нет, но `/verifications/me` отвечает `APPROVED` →
 *    токен устарел (роль выдаётся бэкендом только при login, не при refresh):
 *    чистим cookies и возвращаем 401 — клиент перенаправит на /login.
 *  - Иначе — 403 «нужна верификация».
 */
export async function ensureVerified(event: H3Event): Promise<void> {
	const cookie = getHeader(event, "cookie");
	if (hasAtLeastRole(cookie, "VERIFIED_RESIDENT")) return;

	const config = useRuntimeConfig();
	let approved = false;
	try {
		const res = await axios.get(`${config.api}/verifications/me`, {
			headers: { cookie },
			withCredentials: true,
			validateStatus: (s) => (s >= 200 && s < 300) || s === 404,
		});
		approved = res.status === 200 && res.data?.status === "APPROVED";
	} catch {
		// при ошибке — игнорируем, считаем что не верифицирован
	}

	if (approved) {
		clearAuthCookies(event);
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
			message: "Session is stale after verification, please re-login",
		});
	}

	throw createError({
		statusCode: 403,
		statusMessage: "Forbidden",
		message: "Resident verification is required",
	});
}
