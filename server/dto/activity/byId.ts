export type ActivityDtoById = {
	createdAt: string;
	createdBy: string;
	description: string;
	dormitoryId: string;
	endTime: string;
	id: string;
	imageIds: Array<string>;
	isPrivate: Boolean;
	location: string;
	moderationComment: string;
	moderationStatus: string;
	participants: Array<{
		activityId: string;
		createdAt: string;
		id: string;
		status: string;
		userId: string;
	}>;
	startTime: string;
	title: string;
	updatedAt: string;
	viewTemplate: number;
};
