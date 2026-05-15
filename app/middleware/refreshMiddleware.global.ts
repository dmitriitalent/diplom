import { useAuthStore } from "~/stores/authStore";
import { useSelfStore } from "~/stores/selfStore";

/** Обновляем access token, если до истечения осталось меньше этого порога */
const REFRESH_LEEWAY_SEC = 60;

export default defineNuxtRouteMiddleware(async (to) => {
	const cfg = useRuntimeConfig();
	if (cfg.public.publicRoutes.includes(to.path)) return;

	const auth = useAuthStore();
	const self = useSelfStore();

	// 1. Access token: рефрешим ТОЛЬКО если он скоро протухнет (или его нет)
	const exp = auth.payload?.exp as number | undefined;
	const now = Math.floor(Date.now() / 1000);
	const tokenFresh =
		typeof exp === "number" && exp - now > REFRESH_LEEWAY_SEC;

	if (!tokenFresh) {
		try {
			await auth.refresh();
		} catch {
			return navigateTo("/");
		}
	}

	// 2. Self: грузим ОДИН РАЗ и держим в памяти. Не блокируем навигацию —
	//    подтянется фоном, страницы реактивно отрисуются, когда придёт.
	if (!self.self) {
		self.refreshSelf().catch(() => {
			/* ignore — не критично для навигации */
		});
	}
});
