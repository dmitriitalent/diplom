import fs from "node:fs";
import path from "node:path";
import { STATICFILES_DIR, ensureStaticfilesDir } from "~~/server/utils/staticfiles";
import { sendVerificationEmail } from "~~/server/utils/mailer";

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

	try {
		await sendVerificationEmail(email, code);
	} catch (err: any) {
		throw createError({
			statusCode: 502,
			message: "Не удалось отправить письмо. Попробуйте позже.",
		});
	}

	ensureStaticfilesDir();
	const filePath = path.join(STATICFILES_DIR, `${emailToFileKey(email)}.json`);
	fs.writeFileSync(filePath, JSON.stringify({ code, email, expires }), "utf-8");

	return { success: true };
});
