import type { FormElement } from "./Form";

type FormCheckbox = FormElement & {
	key: string;
	value: boolean;
	name: string;
	required?: boolean;
	leftIconName?: string;
};

export { type FormCheckbox };
