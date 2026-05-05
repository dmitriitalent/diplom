export type ServiceDtoById = {
	description: string;
	id: string;
	images: Array<{ fileGuid: string; id: string; sortOrder: number }>;
	name: string;
	ownerId: string;
	price: number;
	publishedAt: string;
	status: string;
	updatedAt: string;
	viewTemplate: number;
};
