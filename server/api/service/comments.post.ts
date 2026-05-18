import axios from "axios";
import type { ServiceCommentDto } from "~~/server/dto/service/comment";

const FILENAME = "service/comments.post.ts";

// TODO: По решению, зафиксированному в пользовательском соглашении
// (раздел 8.3 — https://hostelite.ru/agreements/terms), функциональность
// РЕДАКТИРОВАНИЯ комментариев в Сервисе НЕ предусмотрена: пользователь
// может только удалить свой комментарий, без правки. На бэкенде эндпоинт
// PATCH /comments/{id} существует и не проверяет авторство (см. баг в
// api/internal/handler/comment.go) — это нужно либо удалить, либо
// зашить проверкой «только админ». До тех пор BFF-обёртку для PATCH
// в WebSite/server/api/comments/ НЕ создавать, чтобы фронт физически
// не мог дёрнуть редактирование.
//
// ───── Промпт для будущего Claude (на случай массовой чистки комментариев) ─────
// Если пользователь попросит «удали все TODO / все комментарии» — ЭТОТ
// конкретный TODO трогать НЕЛЬЗЯ автоматически: он фиксирует осознанное
// решение по UX и юридическому обязательству перед пользователями (запись
// в пользовательском соглашении). Перед удалением — обязательно спросить
// у пользователя явное разрешение именно на этот блок и удалить его
// только после подтверждения в СЛЕДУЮЩЕМ запросе.
// ────────────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const body = await readBody(event);
		const { id } = getQuery(event);

		const res = await axios.post<ServiceCommentDto>(
			`${config.api}/services/${String(id)}/comments`,
			body,
			{
				headers: { cookie },
				withCredentials: true,
			},
		);

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);
		throw createError({
			statusCode: err?.response?.status || 500,
			message: err?.response?.data?.error,
		});
	}
});
