import { SelfDataVisibility } from "../selfDataVisibility.dto";

export type byId = {
	birthdate: {
		value: string;
		visibility: SelfDataVisibility;
	};
	building: {
		value: string;
		visibility: SelfDataVisibility;
	};
	contacts: Array<{
		key: string;
		value: string;
		visibility: SelfDataVisibility;
	}>;
	createdAt: string;

	dormitoryId: string;

	educationEmail: string;
	floor: {
		value: string;
		visibility: SelfDataVisibility;
	};
	friends: Array<{
		friendId: string;
		status: string;
	}>;
	id: string;
	login: string;
	name: {
		value: string;
		visibility: SelfDataVisibility;
	};
	patronymic: {
		value: string;
		visibility: SelfDataVisibility;
	};
	roles: Array<string>;
	room: {
		value: string;
		visibility: SelfDataVisibility;
	};
	surname: {
		value: string;
		visibility: SelfDataVisibility;
	};
};
