import axios from "axios";

const FILENAME = "user/byId.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const query = getQuery(event);
		const id = query.id;
		if (id === "2") {
			return {
				id: 2,
				login: "Stritten",
				educationEmail: "qwe@qwe.qwe",
				hei: "MAI",
				birthdate: new Date(2004, 1, 21),
				dormitory: "Икар (г. Москва, ул. Дубосековская, д. 13)",
				building: "2",
				floor: "4",
				room: "2413",
				surname: "Дерин",
				name: "Дмитрий",
				patronymic: "Михайлович",

				friends: [
					{
						id: 2,
						login: "Stritten",
						educationEmail: "qwe@qwe.qwe",
						consentUserAgreement: true,
						hei: "MAI",
						birthdate: new Date(2004, 1, 21),
						dormitory: "Икар (г. Москва, ул. Дубосековская, д. 13)",
						building: "2",
						floor: "4",
						room: "2413",
						surname: "Квашнин",
						name: "Владимир",
						patronymic: "Михайлович",

						friends: [],

						contacts: [],
					},
					{
						id: 1331,
						login: "Stritten",
						educationEmail: "qwe@qwe.qwe",
						consentUserAgreement: true,
						hei: "MAI",
						birthdate: new Date(2002, 5, 11),
						dormitory: "Икар (г. Москва, ул. Дубосековская, д. 13)",
						building: "2",
						floor: "4",
						room: "2411",
						surname: "Квашнин",
						name: "Владимир",
						patronymic: "Михайлович",

						friends: [],

						contacts: [],
					},
				],

				contacts: [
					{
						key: "phone",
						value: "+7 123 456 78 90",
					},
					{
						key: "Telegram",
						value: "@dmitrii_talent",
					},
					{
						key: "twitch",
						value: "@stritten",
					},
				],
			};
		} else if (id === "1") {
			return {
				id: 1,
				login: "DmitriyTalent",
				educationEmail: "educationEmail",
				hei: "hei",
				birthdate: new Date(2004, 1, 21),
				dormitory: "Икар (г. Москва, ул. Дубосековская, д. 13)",
				building: "building",
				floor: "floor",
				room: "room",
				surname: "surname",
				name: "name",
				patronymic: "patronymic",

				friends: [
					{
						id: 2,
						login: "Stritten",
						educationEmail: "qwe@qwe.qwe",
						consentUserAgreement: true,
						hei: "MAI",
						birthdate: new Date(2004, 1, 21),
						dormitory: "Икар (г. Москва, ул. Дубосековская, д. 13)",
						building: "2",
						floor: "4",
						room: "2413",
						surname: "Квашнин",
						name: "Владимир",
						patronymic: "Михайлович",

						friends: [],

						contacts: [],
					},
					{
						id: 1,
						login: "Stritten",
						educationEmail: "qwe@qwe.qwe",
						consentUserAgreement: true,
						hei: "MAI",
						birthdate: new Date(2002, 5, 11),
						dormitory: "Икар (г. Москва, ул. Дубосековская, д. 13)",
						building: "2",
						floor: "4",
						room: "2411",
						surname: "Квашнин",
						name: "Владимир",
						patronymic: "Михайлович",

						friends: [],

						contacts: [],
					},
				],

				contacts: [
					{
						key: "phone",
						value: "+7 098 765 43 21",
					},
					{
						key: "Telegram",
						value: "@dimasik098",
					},
					{
						key: "twitch",
						value: "twitch.tv/dimasik098",
					},
				],
			};
		} else {
			throw "user not found";
		}
	} catch (err) {
		console.log("error at " + FILENAME + ": " + String(err));
		console.log(err);
		throw createError({
			statusCode: 500,
		});
	}
});
