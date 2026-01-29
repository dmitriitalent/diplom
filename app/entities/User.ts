export type UserDataVisibility = "ADMIN" | "FRIEND" | "EVERYONE";

export type User = {
	id: number;
	login: string;
	educationEmail: string;
	consentUserAgreement: boolean;
	hei: string;
	birthdate: {
		value: Date;
		visibility: UserDataVisibility;
	};
	dormitory: {
		value: string;
		visibility: UserDataVisibility;
	};
	building: {
		value: string;
		visibility: UserDataVisibility;
	};
	floor: {
		value: string;
		visibility: UserDataVisibility;
	};
	room: {
		value: string;
		visibility: UserDataVisibility;
	};
	surname: {
		value: string;
		visibility: UserDataVisibility;
	};
	name: {
		value: string;
		visibility: UserDataVisibility;
	};
	patronymic: {
		value: string;
		visibility: UserDataVisibility;
	};

	contacts:
		| Array<{
				key: string;
				value: string;
				visibility: UserDataVisibility;
		  }>
		| [];
};
