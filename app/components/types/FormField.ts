import type { FormElement } from "./Form";

type FormFieldType = "text" | "number" | "password";
type FormField = FormElement & {
	type: FormFieldType;
	key: string;
	value: string;
	placeholder?: string;
	required?: boolean;
	validator?: Function;
	leftIconName?: string;
	autocomplete?: string;
};

export { type FormField, type FormFieldType };
