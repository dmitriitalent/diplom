import type { FormElement } from "./Form";

type FormButton = FormElement & {
	name?: string;
	action: Function;
	required?: boolean;
	leftIconName?: string;
};

export { type FormButton };
