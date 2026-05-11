export type Post = {
	id: string;
	userId: string;
	content: string;
	imageIds: string[];
	visibility: string;
	createdAt: string;
	updatedAt: string;
};

export type PostListDto = {
	posts: Post[];
};
