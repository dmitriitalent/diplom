import type { User } from "./User";

export type Activity = {
	createdAt: string;
	author: User;
	description: string;
	dormitoryId: string;
	endTime: string;
	id: string;
	imageIds: Array<string>;
	isPrivate: Boolean;
	location: string;
	moderationComment: string;
	moderationStatus: string;
	participants: Array<User>;
	startTime: string;
	title: string;
	updatedAt: string;
	viewTemplate: number;
};
