import type { User } from "./User";

export type SelfDataVisibility = "ADMIN" | "FRIEND" | "EVERYONE";

export type Self = {
	id: number;
	login: string;
	educationEmail: string;
	consentUserAgreement: boolean;
	hei: string;
	birthdate: {
		value: Date;
		visibility: SelfDataVisibility;
	};
	dormitory: {
		value: string;
		visibility: SelfDataVisibility;
	};
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

	friends: {
		value: Array<User>;
		visibility: SelfDataVisibility;
	};

	contacts: Array<{
		key: string;
		value: string;
		visibility: SelfDataVisibility;
	}>;
};
