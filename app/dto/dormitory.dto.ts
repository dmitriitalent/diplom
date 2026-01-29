export type FloorDTO = {
	name: string;
	value: string;
	leftIconName: string;
};

export type BuildingDTO = {
	name: string;
	value: string;
	leftIconName: string;
	floors: Array<FloorDTO>;
};

export type DormitroyDTO = {
	name: string;
	value: string;
	leftIconName: string;
	buildings: Array<BuildingDTO>;
};
