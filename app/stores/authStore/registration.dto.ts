export type RegistrationDto = {
	login: string;
	password: string;
	passwordConfirm: string;
	educationEmail: string;
	hei: string;
	birthdate: Date;
	phone: string;
	dormitory?: string;
	building?: string;
	floor?: string;
	room?: string;
	surname?: string;
	name?: string;
	patronymic?: string;
};
