import type { LoginDto } from "../../dto/login.dto";
import type { RegistrationDto } from "../../dto/registration.dto";

export const useAuthStore = defineStore("authStore", () => {
	const at = useCookie("accessToken");

	const isAuthenticated = computed(() => !!at.value);

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
