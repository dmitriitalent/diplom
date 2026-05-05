export type ServiceCommentDto = {
	authorId: string;
	body: string;
	id: string;
	listingId: string;
	publishedAt: string;
	updatedAt: string;
};

export type ServiceCommentsListDto = {
	comments: Array<ServiceCommentDto>;
};
