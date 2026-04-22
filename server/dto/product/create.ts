export type ProductDtoCreate = {
	categoryId: string;
	description: string;
	images: Array<{
		fileGuid: string;
		sortOrder: number;
	}>;
	name: string;
	price: number;
	viewTemplate: number;
};
