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
	const url = new URL(`${UNISENDER_BASE}/sendEmail`);
	url.searchParams.set("format", "json");
	url.searchParams.set("api_key", UNISENDER_API_KEY);
	url.searchParams.set("email", params.email);
	url.searchParams.set("sender_name", "Hostelite.ru");
	url.searchParams.set("sender_email", "dmitriitalent@gmail.com");
	url.searchParams.set("subject", params.subject);
	url.searchParams.set("body", params.body);
	url.searchParams.set("list_id", String(params.listId));
	url.searchParams.set("lang", "ru");
	url.searchParams.set("error_checking", "1");

	const res = await $fetch<any>(url.toString());

	if (Array.isArray(res?.result) && res.result[0]?.errors?.length) {
		const err = res.result[0].errors[0];
		throw new Error(`Ошибка отправки письма: ${err.code}`);
	}
}
