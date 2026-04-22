import type { User } from "./User";

export type News = {
	activityIds: Array<string>;
	author: User;
	content: string;
	createdAt: string;
	dormitoryId: string;
	id: string;
	imageIds: Array<String>;
	moderationComment: string;
	moderationStatus: string;
	productIds: Array<String>;
	reactionCount: number;
	title: string;
	updatedAt: string;
	userReaction: string;
	viewTemplate: number;
};
