export type UserDto = {
	id: number;
	login: string;
	education_email: string;
	consent_user_agreement: boolean;
	hei: string;
	birthdate: Date;
	dormitory: string;
	building: string;
	floor: string;
	room: string;
	surname: string;
	name: string;
	patronymic: string;

	friends: Array<UserDto>;

	contacts:
		| Array<{
				key: string;
				value: string;
		  }>
		| [];
};
