import type { SelfDataVisibility } from "~~/server/dto/selfDataVisibility.dto";
import type { Dormitory } from "./Dormitory";
import type { User } from "./User";

export type Self = {
	id: string;
	login: string;
	educationEmail: string;
	birthdate: {
		value: Date;
		visibility: SelfDataVisibility;
	};
	dormitory: Dormitory;
	building: {
		value: string;
		visibility: SelfDataVisibility;
	};
	floor: {
		value: string;
		visibility: SelfDataVisibility;
	};
	room: {
		value: string;
		visibility: SelfDataVisibility;
	};
	surname: {
		value: string;
		visibility: SelfDataVisibility;
	};
	name: {
		value: string;
		visibility: SelfDataVisibility;
	};
	patronymic: {
		value: string;
		visibility: SelfDataVisibility;
	};

	friends: Array<{
		friendId: string;
		status: string;
	}>;

	contacts: Array<{
		key: string;
		value: string;
		visibility: SelfDataVisibility;
		isPrimary: boolean;
	}>;
};
