import type { LoginDto } from "./login.dto";
import type { RegistrationDto } from "./registration.dto";

export const useAuthStore = defineStore("authStore", () => {
	const at = useCookie("at");

	const isAuthenticated = computed(() => !!at.value);

	const registration = (regData: RegistrationDto) => {
		return $fetch("/api/auth/registration", {
			method: "POST",
			body: regData,
		}).then((res) => {
			console.log(res);
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
		}).then((res) => {
			console.log(res);
		});
	};

	const logout = () => {};

	return {
		at,
		isAuthenticated,
		registration,
		login,
		refresh,
		logout,
	};
});
