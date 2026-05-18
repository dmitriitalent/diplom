import axios from "axios";
import { RegistrationDto } from "~~/server/dto/registration.dto";

const FILENAME = "auth/registration.post.ts";

type RegistrationBody = RegistrationDto & {
	passwordConfirm?: string;
	vkContact?: string;
};

type BackendContact = {
	key: string;
	value: string;
	visibility: "EVERYONE" | "FRIEND" | "ADMIN";
	isPrimary: boolean;
};

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const body = (await readBody(event)) as RegistrationBody;

		const date = (body.birthdate as unknown as string)
			.split("T")[0]
			.split(".")[0]
			.split("-");
		const birthdate = date[2] + "." + date[1] + "." + date[0];

		// VK обязателен для резидентов и сохраняется как primary-контакт.
		const contacts: BackendContact[] = [];
		const vk = body.vkContact?.trim();
		if (body.isResident && vk) {
			contacts.push({
				key: "vk",
				value: vk,
				visibility: "EVERYONE",
				isPrimary: true,
			});
		}

		const res = await axios.post<{ accessToken: string; refreshToken: string }>(
			`${config.api}/auth/registration`,
			{
				login: body.login,
				password: body.password,
				password_confirm: body.passwordConfirm,
				education_email: body.educationEmail,
				hei: body.hei,
				birthdate: birthdate,
				consent_user_agreement: body.consentUserAgreement,
				dormitory_id: body.dormitory,
				building: body.building,
				floor: body.floor,
				room: body.room,
				surname: body.surname,
				name: body.name,
				patronymic: body.patronymic,
				contacts,
			},
			{
				withCredentials: true,
			},
		);

		setCookie(event, "accessToken", res.data.accessToken);
		setCookie(event, "refreshToken", res.data.refreshToken);

		// Если пользователь указал что проживает в общежитии — автоматически создаём заявку на верификацию
		if (body.isResident && body.educationEmail && body.dormitory) {
			try {
				await axios.post(
					`${config.api}/verifications`,
					{ documentId: body.educationEmail },
					{
						headers: {
							Cookie: `accessToken=${res.data.accessToken}; refreshToken=${res.data.refreshToken}`,
						},
					},
				);
			} catch (verifyErr: any) {
				console.log(FILENAME, "auto-verification submit failed:", verifyErr?.response?.data);
			}
		}

		return "login success";
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.data);

		throw createError({
			statusCode: err?.response?.status || 500,
			statusMessage:
				err?.response?.data?.message || "Неверный логин или пароль",
		});
	}
});
