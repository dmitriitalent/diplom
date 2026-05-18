export type OrderDtoById = {
	id: string;
	type: string;
	description: string;
	imageIds: Array<string>;
	authorId: string;
	createdAt: string;
	updatedAt: string;
	closedAt: string | null;
	closeType: "completed" | "declined" | null;
	closeComment: string;
	status: "open" | "closed";
};
