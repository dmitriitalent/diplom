export type Category = {
	id: string;
	name: string;
	children: Array<Category>;
	slug: string;
};
