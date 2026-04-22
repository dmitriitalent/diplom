export type CategoriesDtoGetList = {
	categories: Array<{
		id: string;
		name: string;
		parentId: string;
		slug: string;
	}>;
};
