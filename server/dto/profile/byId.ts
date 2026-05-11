export type byId = {
	avatarId?: string;
	birthdate: string;
	building: string;
	contacts: Array<{
		key: string;
		value: string;
		isPrimary?: boolean;
	}>;
	createdAt: string;

	dormitoryId: string;

	educationEmail: string;
	floor: string;
	friends: Array<{
		friendId: string;
		status: string;
	}>;
	id: string;
	login: string;
	name: string;
	patronymic: string;
	roles: Array<string>;
	room: string;
	surname: string;
};
