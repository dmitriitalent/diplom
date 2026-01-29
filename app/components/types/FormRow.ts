import type { FormElement } from "./Form";
import type { FormDate } from "./FormDate";
import type { FormField } from "./FormField";
import type { FormSelect } from "./FormSelect";
import type { FormSeparator } from "./FormSeparator";

type FormRow = FormElement & {
	elems: Array<FormField | FormSelect | FormDate | FormSeparator>;
};

export { type FormRow };
