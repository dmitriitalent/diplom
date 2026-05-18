import fs from "node:fs";
import path from "node:path";
import { STATICFILES_DIR, ensureStaticfilesDir } from "~~/server/utils/staticfiles";
import { deleteUnisenderList } from "~~/server/utils/unisender";

const STUDENT_EMAIL_REGEX = /^[^@]+@mai\.education$/i;

function emailToFileKey(email: string): string {
	return "ev-" + Buffer.from(email.toLowerCase()).toString("base64url");
}

interface VerifyData {
	code: string;
	email: string;
	listId: number;
	expires: number;
}

export default defineEventHandler(async (event) => {
	const body = await readBody<{ email: string; code: string }>(event);
	const email = body?.email?.trim().toLowerCase();
	const code = body?.code?.trim();

	if (!email || !STUDENT_EMAIL_REGEX.test(email) || !code) {
		throw createError({ statusCode: 400, message: "Укажите email и код верификации" });
	}

	ensureStaticfilesDir();
	const filePath = path.join(STATICFILES_DIR, `${emailToFileKey(email)}.json`);

	if (!fs.existsSync(filePath)) {
		throw createError({ statusCode: 404, message: "Код не найден. Запросите новый." });
	}

	let data: VerifyData;
	try {
		data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
	} catch {
		throw createError({ statusCode: 500, message: "Ошибка чтения данных верификации" });
	}

	if (Date.now() > data.expires) {
		fs.unlinkSync(filePath);
		await deleteUnisenderList(data.listId);
		throw createError({ statusCode: 410, message: "Код истёк. Запросите новый код." });
	}

	if (data.code !== code) {
		throw createError({ statusCode: 422, message: "Неверный код верификации" });
	}

	fs.unlinkSync(filePath);
	await deleteUnisenderList(data.listId);

	return { success: true };
});
