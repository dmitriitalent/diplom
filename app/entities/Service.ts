import type { User } from "./User";

export type ServiceComment = {
	id: string;
	listingId: string;
	authorId: string;
	author?: User;
	body: string;
	publishedAt: string;
	updatedAt: string;
};

export type Service = {
	id: string;
	name: string;
	description: string;
	images: Array<{ fileGuid: string; id: string; sortOrder: number }>;
	owner: User;
	price: number;
	publishedAt: string;
	status: string;
	updatedAt: string;
	viewTemplate: number;
	comments?: ServiceComment[];
};
