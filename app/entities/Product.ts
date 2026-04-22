import type { Category } from "./Category";
import type { User } from "./User";

export type Product = {
	category: Category;
	description: string;
	id: string;
	images: Array<{
		fileGuid: string;
		id: string;
		sortOrder: number;
	}>;
	name: string;
	owner: User;
	price: number;
	publishedAt: string;
	status: string;
	updatedAt: string;
	viewTemplate: number;
};
