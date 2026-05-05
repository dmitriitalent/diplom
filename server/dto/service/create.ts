export type ServiceDtoCreate = {
	description: string;
	images: Array<{ fileGuid: string; sortOrder: number }>;
	name: string;
	price: number;
	viewTemplate: number;
};
