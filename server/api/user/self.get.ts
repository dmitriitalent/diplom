import axios from "axios";

const FILENAME = "user/self.get.ts";

export default defineEventHandler(async (event) => {
	try {
		const uid = JSON.parse(
			atob(parseCookies(event).at.split(".")[1]!)
		).userId;
		if (uid === 2) {
			return {
				id: 2,
				login: "Stritten",
				educationEmail: "qwe@qwe.qwe",
				hei: "MAI",
				birthdate: {
					value: new Date(2004, 1, 21),
					visibility: "FRIEND",
				},
				dormitory: {
					value: "Икар (г. Москва, ул. Дубосековская, д. 13)",
					visibility: "FRIEND",
				},
				building: {
					value: "2",
					visibility: "FRIEND",
				},
				floor: {
					value: "4",
					visibility: "FRIEND",
				},
				room: {
					value: "2413",
					visibility: "FRIEND",
				},
				surname: {
					value: "Дерин",
					visibility: "EVERYONE",
				},
				name: {
					value: "Дмитрий",
					visibility: "EVERYONE",
				},
				patronymic: {
					value: "Михайлович",
					visibility: "EVERYONE",
				},

				contacts: [
					{
						key: "phone",
						value: "+7 123 456 78 90",
						visibility: "EVERYONE",
					},
					{
						key: "Telegram",
						value: "@dmitrii_talent",
						visibility: "EVERYONE",
					},
					{
						key: "twitch",
						value: "@stritten",
						visibility: "EVERYONE",
					},
				],
			};
		} else if (uid === 1) {
			return {
				id: 1,
				login: "DmitriyTalent",
				educationEmail: "educationEmail",
				hei: "hei",
				birthdate: {
					value: new Date(2004, 1, 21),
					visibility: "ADMIN",
				},
				dormitory: {
					value: "Икар (г. Москва, ул. Дубосековская, д. 13)",
					visibility: "ADMIN",
				},
				building: {
					value: "building",
					visibility: "ADMIN",
				},
				floor: {
					value: "floor",
					visibility: "ADMIN",
				},
				room: {
					value: "room",
					visibility: "ADMIN",
				},
				surname: {
					value: "surname",
					visibility: "ADMIN",
				},
				name: {
					value: "name",
					visibility: "ADMIN",
				},
				patronymic: {
					value: "patronymic",
					visibility: "ADMIN",
				},

				contacts: [
					{
						key: "phone",
						value: "+7 098 765 43 21",
						visibility: "EVERYONE",
					},
					{
						key: "Telegram",
						value: "@dimasik098",
						visibility: "EVERYONE",
					},
					{
						key: "twitch",
						value: "twitch.tv/dimasik098",
						visibility: "EVERYONE",
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
