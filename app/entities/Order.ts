import type { User } from "./User";

export type Order = {
	id: string;
	type: string;
	description: string;
	imageIds: Array<string>;
	authorId: string;
	author?: User;
	createdAt: string;
	updatedAt: string;
	closedAt: string | null;
	closeType: "completed" | "declined" | null;
	closeComment: string;
	status: "open" | "closed";
};
