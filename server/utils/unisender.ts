const UNISENDER_API_KEY = "6mz97qdwe6ddqnmn6s5kbrseafd4tq63mrcabo3o";
const UNISENDER_BASE = "https://api.unisender.com/ru/api";

export async function createUnisenderList(title: string): Promise<number> {
	const url = `${UNISENDER_BASE}/createList?format=json&api_key=${UNISENDER_API_KEY}&title=${encodeURIComponent(title)}`;
	const res = await $fetch<{ result?: { id: number }; error?: string }>(url);
	if (!res?.result?.id) {
		throw new Error(res?.error ?? "Не удалось создать список рассылки");
	}
	return res.result.id;
}

export async function deleteUnisenderList(listId: number): Promise<void> {
	const url = `${UNISENDER_BASE}/deleteList?format=json&api_key=${UNISENDER_API_KEY}&list_id=${listId}`;
	await $fetch(url).catch(() => {});
}

export async function sendUnisenderEmail(params: {
	email: string;
	subject: string;
	body: string;
	listId: number;
}): Promise<void> {
	const formData = new URLSearchParams({
		format: "json",
		api_key: UNISENDER_API_KEY,
		email: params.email,
		sender_name: "Hostelite.ru",
		sender_email: "dmitriitalent@gmail.com",
		subject: params.subject,
		body: params.body,
		list_id: String(params.listId),
		lang: "ru",
		error_checking: "1",
	});

	const res = await $fetch<any>(`${UNISENDER_BASE}/sendEmail`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: formData.toString(),
	});

	// Ошибка на уровне API (invalid_arg, auth fail и т.д.)
	if (res?.code && res?.error) {
		throw new Error(`Ошибка Unisender: ${res.error} (${res.code})`);
	}

	// Ошибки на уровне адресата (error_checking=1)
	if (Array.isArray(res?.result) && res.result[0]?.errors?.length) {
		const err = res.result[0].errors[0];
		throw new Error(`Ошибка отправки письма: ${err.code} — ${err.message}`);
	}
}
