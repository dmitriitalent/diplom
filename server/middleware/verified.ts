/**
 * BFF-guard: блокирует доступ к Schedule и News эндпоинтам, если у пользователя
 * нет роли VERIFIED_RESIDENT или выше. При устаревшем токене (есть APPROVED
 * заявка на верификацию, но роль в JWT отсутствует) — чистит куки и
 * возвращает 401, форсируя релогин.
 */
export default defineEventHandler(async (event) => {
	const path = event.path ?? event.node.req.url ?? "";

	const isSchedule =
		path.startsWith("/api/shower") ||
		path.startsWith("/api/washingmachine");

	const isNews = path.startsWith("/api/news");

	if (!isSchedule && !isNews) return;

	await ensureVerified(event);
});
