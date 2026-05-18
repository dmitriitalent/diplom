import axios from "axios";
import { ContactDto } from "~~/server/dto/contact.dto";
import { UpdateSelfDto } from "~~/server/dto/updateSelf.dto";

const FILENAME = "self/settings/settings.put.ts";

// Серверная версия — без зависимости от ~/utils/contactUrl (app-only).
const VK_KEYS = ["vk", "вк", "вконтакте"];
const MAX_KEYS = ["max", "макс", "max-messenger"];

const matchesAny = (key: string, keys: string[]) => {
	const k = (key ?? "").toLowerCase().trim();
	return keys.some((s) => k.includes(s));
};

const isVk = (key: string) => matchesAny(key, VK_KEYS);
const isMax = (key: string) => matchesAny(key, MAX_KEYS);

/**
 * Гарантирует ровно один primary-контакт.
 * Если ни один не помечен — выбирает: VK → MAX → первый.
 * Если помечено несколько — оставляет первый из них.
 */
const ensureSinglePrimary = (contacts: ContactDto[]): ContactDto[] => {
	if (!contacts || contacts.length === 0) return contacts ?? [];

	// Если уже есть хотя бы один primary — нормализуем к ровно одному.
	const primaryIdx = contacts.findIndex((c) => c.isPrimary);
	if (primaryIdx !== -1) {
		return contacts.map((c, i) => ({ ...c, isPrimary: i === primaryIdx }));
	}

	// Иначе выбираем по приоритету.
	let pickIdx = contacts.findIndex((c) => isVk(c.key));
	if (pickIdx === -1) pickIdx = contacts.findIndex((c) => isMax(c.key));
	if (pickIdx === -1) pickIdx = 0;

	return contacts.map((c, i) => ({ ...c, isPrimary: i === pickIdx }));
};

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

		const normalizedContacts = ensureSinglePrimary(
			(body.contacts ?? []) as ContactDto[],
		);

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
				contacts: normalizedContacts,
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
