import { useAuthStore } from "~/stores/authStore";
import { useSelfStore } from "~/stores/selfStore";

export default defineNuxtRouteMiddleware(async (to) => {
	const cfg = useRuntimeConfig();
	if (cfg.public.publicRoutes.includes(to.path)) return;

	const auth = useAuthStore();
	const self = useSelfStore();

	try {
		await auth.refresh();
		await self.refreshSelf();
	} catch {
		return navigateTo("/welcome");
	}
});
