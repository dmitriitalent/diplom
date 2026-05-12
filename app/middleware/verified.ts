import { useAuthStore } from "~/stores/authStore";

/**
 * Защищает страницы только для верифицированных резидентов.
 * Если роли нет — пробуем понять, не устарел ли токен (есть APPROVED заявка),
 * и при необходимости делаем logout + редирект на /login. Иначе ведём в
 * настройки профиля, где можно подать заявку.
 */
export default defineNuxtRouteMiddleware(async () => {
	const auth = useAuthStore();

	if (!auth.isAuthenticated) return navigateTo("/login");
	if (auth.isVerified) return;

	try {
		const me: any = await $fetch("/api/verifications/me");
		if (me?.status === "APPROVED") {
			// Токен выдан до верификации — нужен relogin
			try {
				await auth.logout();
			} catch { /* ignore */ }
			return navigateTo("/login");
		}
	} catch { /* ignore */ }

	return navigateTo("/profile/self/settings");
});
