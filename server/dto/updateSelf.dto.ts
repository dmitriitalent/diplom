import { UserDto } from "../api/user/user.dto";
import { ContactDto } from "./contact.dto";
import { SelfDataVisibility } from "./selfDataVisibility.dto";

export type UpdateSelfDto = {
	id: number;
	login: string;
	education_email: string;
	consent_user_agreement: boolean;
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

	contacts: Array<ContactDto> | [];
};
