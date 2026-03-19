export type UserDto = {
	id: number;
	login: string;
	educationEmail: string;
	consentUserAgreement: boolean;
	hei: string;
	birthdate: string;
	dormitory: string;
	building: string;
	floor: string;
	room: string;
	surname: string;
	name: string;
	patronymic: string;
	friends: Array<UserDto>;
	contacts: [
		{
			key: string;
			value: string;
		},
	];
};
