export type AbstractDtoCreate = {
	type: "lecture" | "lab";
	title: string;
	subject: string;
	description: string;
	imageIds: Array<string>;
};
