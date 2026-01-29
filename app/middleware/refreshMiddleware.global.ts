import { useAuthStore } from "~/stores/authStore";
import { useUserStore } from "~/stores/userStore";

export default defineNuxtRouteMiddleware(async (to) => {
	const cfg = useRuntimeConfig();
	if (cfg.public.publicRoutes.includes(to.path)) return;

	const auth = useAuthStore();
	const user = useUserStore();

	try {
		await auth.refresh();
		await user.refreshUser();
	} catch {
		return navigateTo("/welcome");
	}
});
