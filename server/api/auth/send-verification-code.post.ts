import fs from "node:fs";
import path from "node:path";
import { STATICFILES_DIR, ensureStaticfilesDir } from "~~/server/utils/staticfiles";
import { createUnisenderList, sendUnisenderEmail, deleteUnisenderList } from "~~/server/utils/unisender";

const STUDENT_EMAIL_REGEX = /^[^@]+@mai\.education$/i;
const CODE_TTL_MS = 20 * 60 * 1000;

function emailToFileKey(email: string): string {
	return "ev-" + Buffer.from(email.toLowerCase()).toString("base64url");
}

function generateCode(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

export default defineEventHandler(async (event) => {
	const body = await readBody<{ email: string }>(event);
	const email = body?.email?.trim().toLowerCase();

	if (!email || !STUDENT_EMAIL_REGEX.test(email)) {
		throw createError({
			statusCode: 400,
			message: "Укажите студенческую почту в формате *@mai.education",
		});
	}

	const code = generateCode();
	const expires = Date.now() + CODE_TTL_MS;

	const listTitle = `hostelite-verify-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	let listId: number;
	try {
		listId = await createUnisenderList(listTitle);
	} catch (err: any) {
		throw createError({ statusCode: 502, message: err.message ?? "Ошибка создания списка рассылки" });
	}

	const emailBody = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px"><h2 style="color:#333">Hostelite — подтверждение регистрации</h2><p style="color:#555">Ваш код верификации:</p><div style="font-size:36px;font-weight:bold;letter-spacing:8px;background:#f5f5f5;border-radius:8px;padding:20px;text-align:center;margin:16px 0">${code}</div><p style="color:#777;font-size:14px">Код действителен 20 минут.</p><p style="color:#777;font-size:14px">Если вы не запрашивали регистрацию — проигнорируйте это письмо.</p><p>{{UnsubscribeUrl}}</p></div>`;

	try {
		await sendUnisenderEmail({
			email,
			subject: "Код верификации Hostelite",
			body: emailBody,
			listId,
		});
	} catch (err: any) {
		await deleteUnisenderList(listId);
		throw createError({ statusCode: 502, message: err.message ?? "Не удалось отправить письмо" });
	}

	ensureStaticfilesDir();
	const filePath = path.join(STATICFILES_DIR, `${emailToFileKey(email)}.json`);
	fs.writeFileSync(filePath, JSON.stringify({ code, email, listId, expires }), "utf-8");

	return { success: true };
});
