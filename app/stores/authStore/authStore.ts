import type { LoginDto } from "./login.dto";
import type { RegistrationDto } from "./registration.dto";

export const useAuthStore = defineStore("authStore", () => {
	const at = ref<string | null>(null);

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
		return $fetch("/api/auth/refresh", {
			method: "POST",
		}).then((res) => {
			console.log(res);
		});
	};

	const logout = () => {};

	return {
		isAuthenticated,
		registration,
		login,
		refresh,
		logout,
	};
});
