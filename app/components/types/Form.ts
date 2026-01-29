import type { FormField } from "./FormField";
import type { FormSelect } from "./FormSelect";
import type { FormDate } from "./FormDate";
import type { FormSeparator } from "./FormSeparator";
import type { FormRow } from "./FormRow";
import type { FormCheckbox } from "./FormCheckbox";

function isFormField(elem: FormElement | undefined): elem is FormField {
	if (elem === undefined) {
		return false;
	}
	return elem.elemType === "field";
}
function isFormSeparator(elem: FormElement | undefined): elem is FormSeparator {
	if (elem === undefined) {
		return false;
	}
	return elem.elemType === "separator";
}
function isFormDate(elem: FormElement | undefined): elem is FormDate {
	if (elem === undefined) {
		return false;
	}
	return elem.elemType === "date";
}
function isFormSelect(elem: FormElement | undefined): elem is FormSelect {
	if (elem === undefined) {
		return false;
	}
	return elem.elemType === "select";
}
function isFormRow(elem: FormElement | undefined): elem is FormRow {
	if (elem === undefined) {
		return false;
	}
	return elem.elemType === "row";
}
function isFormCheckbox(elem: FormElement | undefined): elem is FormCheckbox {
	if (elem === undefined) {
		return false;
	}
	return elem.elemType === "checkbox";
}

type Form = {
	title: string;
	elems: Array<FormField | FormSelect | FormDate | FormSeparator | FormRow>;
};

type FormElement = {
	elemType: "field" | "select" | "date" | "separator" | "row" | "checkbox";
};

export {
	type Form,
	type FormElement,
	isFormField,
	isFormSeparator,
	isFormDate,
	isFormSelect,
	isFormRow,
	isFormCheckbox,
};
