export type ShowerSlot = {
	from: number;
	till: number;
	gender: string;
};

export type ShowerDtoById = {
	id: string;
	dormitoryId: string;
	location: string;
	createdAt: string;
	schedule: ShowerSlot[][];
};
