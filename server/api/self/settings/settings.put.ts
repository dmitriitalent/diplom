import axios from "axios";
import { ContactDto } from "~~/server/dto/contact.dto";
import { UpdateSelfDto } from "~~/server/dto/updateSelf.dto";

const FILENAME = "self/settings/settings.put.ts";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);

		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");

		const date = body.birthdate.value
			.split("T")[0]
			.split(".")[0]
			.split("-");
		const birthdate = date[2] + "." + date[1] + "." + date[0];

		const res = await axios.put<UpdateSelfDto>(
			`${config.api}/profile`,
			{
				birthdate: {
					value: birthdate,
					visibility: body.birthdate.visibility,
				},
				building: {
					value: body.building.value,
					visibility: body.building.visibility,
				},
				consentUserAgreement: true,
				contacts: body.contacts,
				dormitory: {
					value: body.dormitory.value,
					visibility: body.dormitory.visibility,
				},
				education_email: body.educationEmail,
				floor: {
					value: body.floor.value,
					visibility: body.floor.visibility,
				},
				name: {
					value: body.name.value,
					visibility: body.name.visibility,
				},
				patronymic: {
					value: body.patronymic.value,
					visibility: body.patronymic.visibility,
				},
				room: {
					value: body.room.value,
					visibility: body.room.visibility,
				},
				surname: {
					value: body.surname.value,
					visibility: body.surname.visibility,
				},
			},
			{
				headers: {
					cookie,
				},
				withCredentials: true,
			},
		);
	} catch (err) {
		console.log("error at " + FILENAME + ": " + String(err));
		console.log(err);
		throw createError({
			statusCode: 500,
		});
	}
});
