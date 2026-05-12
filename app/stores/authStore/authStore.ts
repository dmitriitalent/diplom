import type { LoginDto } from "../../dto/login.dto";
import type { RegistrationDto } from "../../dto/registration.dto";
import { useSelfStore } from "../selfStore";
import { jwtDecode } from "jwt-decode";
import { hasAtLeast, ROLE_LEVELS, type Role } from "~/constants/roles";

export const useAuthStore = defineStore("authStore", () => {
	const at = useCookie("accessToken");

	const isAuthenticated = computed(() => !!at.value);

	/** Декодированный payload JWT (null если токена нет или он битый) */
	const payload = computed<Record<string, any> | null>(() => {
		if (!at.value) return null;
		try {
			return jwtDecode<any>(at.value);
		} catch {
			return null;
		}
	});

	/** ID пользователя из JWT (sub) */
	const userId = computed<string | null>(() => payload.value?.sub ?? null);

	/** Список ролей из JWT */
	const roles = computed<string[]>(() => {
		const r = payload.value?.roles;
		return Array.isArray(r) ? r : [];
	});

	/** Уровень самой высокой роли (0 = USER, 3 = ADMIN) */
	const currentLevel = computed<number>(() => {
		let max = 0;
		for (const r of roles.value) {
			const lvl = (ROLE_LEVELS as Record<string, number | undefined>)[r];
			if (typeof lvl === "number" && lvl > max) max = lvl;
		}
		return max;
	});

	const hasRole = (min: Role) => hasAtLeast(roles.value, min);

	const isVerified  = computed(() => hasAtLeast(roles.value, "VERIFIED_RESIDENT"));
	const isCommandant = computed(() => hasAtLeast(roles.value, "COMMANDANT"));
	const isAdmin     = computed(() => hasAtLeast(roles.value, "ADMIN"));

	const registration = (regData: RegistrationDto) => {
		return $fetch("/api/auth/registration", {
			method: "POST",
			body: regData,
		});
	};

	const login = (loginData: LoginDto) => {
		return $fetch("/api/auth/login", {
			method: "POST",
			body: loginData,
		}).then((res) => {
			console.log(res);
		});
	};

	const refresh = () => {
		const headers = useRequestHeaders(["cookie"]);

		return $fetch("/api/auth/refresh", {
			method: "POST",
			headers: headers,
		});
	};

	const logout = () => {
		const headers = useRequestHeaders(["cookie"]);

		const { logout } = useSelfStore();
		logout();

		return $fetch("/api/auth/logout", {
			method: "POST",
			headers: headers,
		});
	};

	return {
		at,
		isAuthenticated,
		payload,
		userId,
		roles,
		currentLevel,
		hasRole,
		isVerified,
		isCommandant,
		isAdmin,
		registration,
		login,
		refresh,
		logout,
	};
});
