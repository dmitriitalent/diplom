export type ActivityDtoParticipants = {
	participants: [
		{
			activityId: string;
			createdAt: string;
			id: string;
			status: string;
			userId: string;
		},
	];
};
