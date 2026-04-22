import axios from "axios";
import { RegistrationDto } from "~~/server/dto/registration.dto";

const FILENAME = "auth/registration.post.ts";

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const body = await readBody(event);

		const date = body.birthdate.split("T")[0].split(".")[0].split("-");
		const birthdate = date[2] + "." + date[1] + "." + date[0];

		const res = await axios.post<RegistrationDto>(
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
			},
			{
				withCredentials: true,
			},
		);

		setCookie(event, "accessToken", res.data.accessToken);
		setCookie(event, "refreshToken", res.data.refreshToken);

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
