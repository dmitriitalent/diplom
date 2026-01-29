import type { FormElement } from "./Form";

type FormSelectOption = {
	value: string;
	name?: string;
	leftIconName?: string;
};

type FormSelect = FormElement & {
	key: string;
	options: Function;
	group: string;
	value?: string;
	placeholder?: string;
	required?: boolean;
	validator?: Function;
	leftIconName?: string;
};

export { type FormSelect, type FormSelectOption };
