import type { SelfDataVisibility } from "~/entities/Self";
import type { UserDto } from "./user.dto";

export type SelfDto = {
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
		value: Array<UserDto>;
		visibility: SelfDataVisibility;
	};

	contacts: [
		{
			key: string;
			value: string;
			visibility: SelfDataVisibility;
		},
	];
};
