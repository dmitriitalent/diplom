import type { User } from "./User";

export type AbstractType = "lecture" | "lab";

export type Abstract = {
	id: string;
	type: AbstractType;
	title: string;
	subject: string;
	description: string;
	imageIds: Array<string>;
	authorId: string;
	author?: User;
	likes: Array<string>;
	likeCount: number;
	userLiked: boolean;
	createdAt: string;
	updatedAt: string;
};
