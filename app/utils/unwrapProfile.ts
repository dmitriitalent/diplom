import type { byId } from "~~/server/dto/profile/byId";
import type { Dormitory } from "~/entities/Dormitory";
import type { User } from "~/entities/User";

export const unwrapField = (v: any): string =>
	typeof v === "object" && v !== null ? v.value : v ?? "";

const u = unwrapField;

export const unwrapProfile = (p: byId): User => ({
	id: u(p.id),
	login: u(p.login),
	educationEmail: u(p.educationEmail),
	birthdate: new Date(u(p.birthdate)),
	dormitory: {} as Dormitory,
	building: u(p.building),
	floor: u(p.floor),
	room: u(p.room),
	surname: u(p.surname),
	name: u(p.name),
	patronymic: u(p.patronymic),
	contacts: p.contacts ?? [],
	friends: p.friends ?? [],
});
