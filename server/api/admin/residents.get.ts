import axios from "axios";
import type { ResidentsListDto, ResidentCardDto } from "~~/server/dto/admin/residentCard.dto";

const FILENAME = "admin/residents.get.ts";

const REQUIRED_ROLE = "VERIFIED_RESIDENT";

type ProfileField = { value?: string; visibility?: string };

type BackendUser = {
	id: string;
	avatarId?: string;
	dormitoryId?: string;
	roles?: string[];
	surname?: ProfileField | null;
	name?: ProfileField | null;
	patronymic?: ProfileField | null;
	building?: ProfileField | null;
	floor?: ProfileField | null;
	room?: ProfileField | null;
	contacts?: Array<{
		key?: string;
		value?: string;
		visibility?: string;
		isPrimary?: boolean;
	}>;
};

type BackendSearchResponse = { users?: BackendUser[] };

const fieldValue = (f: ProfileField | null | undefined): string => f?.value ?? "";

export default defineEventHandler(async (event): Promise<ResidentsListDto> => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const query = getQuery(event);

		const params: Record<string, string> = {};
		if (typeof query.surname === "string" && query.surname.trim()) {
			params.surname = query.surname.trim();
		}
		if (typeof query.name === "string" && query.name.trim()) {
			params.name = query.name.trim();
		}
		if (typeof query.patronymic === "string" && query.patronymic.trim()) {
			params.patronymic = query.patronymic.trim();
		}

		const res = await axios.get<BackendSearchResponse>(
			`${config.api}/profile/getUsersBySnp`,
			{
				params,
				headers: { cookie },
				withCredentials: true,
			},
		);

		const users = res.data?.users ?? [];

		const items: ResidentCardDto[] = users
			.filter((u) => Array.isArray(u.roles) && u.roles.includes(REQUIRED_ROLE))
			.map((u) => ({
				id: u.id,
				avatarId: u.avatarId ?? "",
				surname: fieldValue(u.surname),
				name: fieldValue(u.name),
				patronymic: fieldValue(u.patronymic),
				dormitoryId: u.dormitoryId ?? "",
				building: fieldValue(u.building),
				floor: fieldValue(u.floor),
				room: fieldValue(u.room),
				contacts: (u.contacts ?? []).map((c) => ({
					key: c.key ?? "",
					value: c.value ?? "",
					visibility: (c.visibility as any) ?? "EVERYONE",
					isPrimary: c.isPrimary ?? false,
				})),
				roles: u.roles ?? [],
			}));

		return { items };
	} catch (err: any) {
		console.log("error at " + FILENAME + ":", err?.response?.data ?? err);
		throw createError({
			statusCode: err?.response?.status ?? 500,
			statusMessage:
				err?.response?.data?.message ?? "Не удалось загрузить список проживающих",
		});
	}
});
