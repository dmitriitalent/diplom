export type ShowerDtoById = {
	id: string;
	name: string;
	location: string;
	schedule: string; // JSON string: [[{from: number, till: number, gender: string}]]
};
