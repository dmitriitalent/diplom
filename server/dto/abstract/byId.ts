export type AbstractDtoById = {
	id: string;
	type: "lecture" | "lab";
	title: string;
	subject: string;
	description: string;
	imageIds: Array<string>;
	authorId: string;
	likeCount: number;
	userLiked: boolean;
	createdAt: string;
	updatedAt: string;
};
