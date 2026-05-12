/**
 * Централизованная иерархия ролей. Чем больше число — тем больше прав.
 * При проверке используем `hasAtLeast` или сравнение `level >= required`.
 */

export type Role = "USER" | "VERIFIED_RESIDENT" | "COMMANDANT" | "ADMIN";

export const ROLE_LEVELS: Record<Role, number> = {
	USER: 0,
	VERIFIED_RESIDENT: 1,
	COMMANDANT: 2,
	ADMIN: 3,
};

export const ROLES_ORDERED: Role[] = ["USER", "VERIFIED_RESIDENT", "COMMANDANT", "ADMIN"];

/** Уровень самой высокой роли в массиве (0 если ни одной известной не найдено) */
export function highestRoleLevel(roles: readonly string[] | undefined | null): number {
	if (!roles) return 0;
	let max = 0;
	for (const r of roles) {
		const lvl = (ROLE_LEVELS as Record<string, number | undefined>)[r];
		if (typeof lvl === "number" && lvl > max) max = lvl;
	}
	return max;
}

/** true, если в массиве есть роль не ниже `min` */
export function hasAtLeast(
	roles: readonly string[] | undefined | null,
	min: Role,
): boolean {
	return highestRoleLevel(roles) >= ROLE_LEVELS[min];
}
