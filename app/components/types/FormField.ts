import type { Option } from "./Option";

type FormField = {
	key: string;
	value: string;
	date?: Date;
	placeholder?: string;
	separatorTop?: boolean;
	separatorBottom?: boolean;
	validator?: Function;
	required?: boolean;
	type?: "text" | "number" | "password" | "select" | "date";
	leftIconName?: string;
	selectOptions?: Array<Option>;
};

export { type FormField };
