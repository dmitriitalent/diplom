import type { Dormitory } from "./Dormitory";

export type User = {
	id: string;
	login: string;
	educationEmail: string;
	birthdate: Date;
	dormitory: Dormitory;
	building: string;
	floor: string;
	room: string;
	surname: string;
	name: string;
	patronymic: string;

	friends: Array<{
		friendId: string;
		status: string;
	}>;

	contacts: Array<{
		key: string;
		value: string;
	}>;
};
