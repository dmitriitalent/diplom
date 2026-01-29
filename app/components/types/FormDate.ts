import type { FormElement } from "./Form";

type FormDate = FormElement & {
	key: string;
	value: Date | undefined;
	placeholder?: string;
	required?: boolean;
	validator?: Function;
	leftIconName?: string;
};

export { type FormDate };
