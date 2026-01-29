import type { FormElement } from "./Form";

type FormSeparator = FormElement & {
	separator: boolean;
	name?: string;
};

export { type FormSeparator };
