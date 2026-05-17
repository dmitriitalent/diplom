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
	// const exp = auth.payload?.exp as number | undefined;
	// const now = Math.floor(Date.now() / 1000);
	// const tokenFresh =
		// typeof exp === "number" && exp - now > REFRESH_LEEWAY_SEC;

	// if (!tokenFresh) {
		try {
			await auth.refresh();
		} catch {
			return navigateTo("/");
		}
	// }

	// 2. Self: грузим ОДИН РАЗ и держим в памяти. Не блокируем навигацию —
	//    подтянется фоном, страницы реактивно отрисуются, когда придёт.
	if (!self.self) {
		self.refreshSelf().catch(() => {
			/* ignore — не критично для навигации */
		});
	}

	// 3. Проверка устаревшего токена после верификации.
	//    Роль VERIFIED_RESIDENT выдаётся бэкендом только при login, не при refresh.
	//    Если токен выдан до того, как модератор одобрил заявку — принуждаем к
	//    явному re-login. Проверяем не чаще одного раза за сессию (useState
	//    сохраняется между клиентскими навигациями, но сбрасывается при новой загрузке).
	if (auth.isAuthenticated && !auth.isVerified) {
		const verificationChecked = useState("verification-stale-checked", () => false);
		if (!verificationChecked.value) {
			verificationChecked.value = true;
			try {
				const headers = import.meta.server
					? useRequestHeaders(["cookie"])
					: undefined;
				const me = await $fetch<{ status: string } | null>(
					"/api/verifications/me",
					{ headers },
				);
				if (me?.status === "APPROVED") {
					// Токен устарел: верификация одобрена, но роли в JWT ещё нет
					try { await auth.logout(); } catch { /* ignore */ }
					return navigateTo("/login");
				}
			} catch {
				// Сервис недоступен — не блокируем навигацию
			}
		}
	}
});
