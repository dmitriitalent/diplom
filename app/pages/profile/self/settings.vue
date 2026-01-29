<script setup lang="ts">
import { cloneDeep } from "lodash";
import {
	isFormDate,
	isFormField,
	isFormRow,
	isFormSelect,
	isFormSeparator,
	type Form,
	type FormElement,
} from "~/components/types/Form";
import type { FormField } from "~/components/types/FormField";
import type { FormRow } from "~/components/types/FormRow";
import type {
	FormSelect,
	FormSelectOption,
} from "~/components/types/FormSelect";
import type { FormSeparator } from "~/components/types/FormSeparator";
import type { DormitroyDTO } from "~/dto/dormitory.dto";
import type { User, UserDataVisibility } from "~/entities/User";

import { useUserStore } from "~/stores/userStore";

const { user, refreshUser } = useUserStore();

const formVisibility = ref<Array<FormSelectOption>>([
	{
		value: "EVERYONE",
		name: "Все",
	},
	{
		value: "FRIEND",
		name: "Друзья",
	},
	{
		value: "ADMIN",
		name: "Администрация",
	},
]);

const { data: dormitory } = useAsyncData<Array<DormitroyDTO>>(
	async (_nuxtApp, { signal }) => {
		return $fetch("/api/hei/dormitoriesByHei?hei=" + user?.hei, { signal });
	}
);

const contacts = (): Array<FormRow> => {
	const rows: Array<FormRow> = user?.contacts!.map((contact, index) => {
		return {
			elemType: "row",
			elems: [
				{
					elemType: "field",
					type: "text",
					key: "contact" + String(index) + "Key",
					value: contact.key,
				},
				{
					elemType: "field",
					type: "text",
					key: "contact" + String(index) + "Value",
					value: contact.value,
				},
				{
					elemType: "select",
					key: "contact" + String(index) + "Visibility",
					value: contact.visibility,
					group: contact.key + "Visibility",
					options: () => formVisibility.value,
				},
			],
		};
	})!;

	return rows;
};

const generateForm = (): Form => {
	return {
		title: "Настройки",
		elems: [
			{ elemType: "separator", name: "ФИО", separator: true },
			{
				elemType: "row",
				elems: [
					{
						elemType: "field",
						key: "surname",
						type: "text",
						value: user?.surname.value ?? "",
					},

					{
						elemType: "select",
						key: "surnameVisibility",
						value: user?.surname.visibility,
						group: "surnameVisibility",
						options: () => formVisibility.value,
					},
				],
			},
			{
				elemType: "row",
				elems: [
					{
						elemType: "field",
						key: "name",
						type: "text",
						value: user?.name.value ?? "",
					},

					{
						elemType: "select",
						key: "nameVisibility",
						value: user?.name.visibility,
						group: "nameVisibility",
						options: () => formVisibility.value,
					},
				],
			},
			{
				elemType: "row",
				elems: [
					{
						elemType: "field",
						key: "patronymic",
						type: "text",
						value: user?.patronymic.value ?? "",
					},

					{
						elemType: "select",
						key: "patronymicVisibility",
						value: user?.patronymic.visibility,
						group: "patronymicVisibility",
						options: () => formVisibility.value,
					},
				],
			},

			{ elemType: "separator", name: "День рождения", separator: true },
			{
				elemType: "row",
				elems: [
					{
						elemType: "date",
						key: "birthdate",
						value: user?.birthdate.value,
					},
					{
						elemType: "select",
						key: "birthdateVisibility",
						value: user?.birthdate.visibility,
						group: "birthdateVisibility",
						options: () => formVisibility.value,
					},
				],
			},

			{ elemType: "separator", name: "Общежитие", separator: true },
			{
				elemType: "row",
				elems: [
					{
						elemType: "select",
						key: "dormitory",
						value: user?.dormitory.value,
						group: "dormitory",
						options: () => {
							return dormitory.value;
						},
					},
					{
						elemType: "select",
						key: "dormitoryVisibility",
						value: user?.dormitory.visibility,
						group: "dormitoryVisibility",
						options: () => formVisibility.value,
					},
				],
			},
			{
				elemType: "row",
				elems: [
					{
						elemType: "select",
						key: "building",
						value: user?.building.value,
						group: "dormitory",
						options: (s1: FormSelect) => {
							if (s1.value !== undefined) {
								return dormitory.value?.find(
									(dorm) => dorm.value === s1.value
								)?.buildings;
							}
							return [];
						},
					},
					{
						elemType: "select",
						key: "buildingVisibility",
						value: user?.building.visibility,
						group: "buildingVisibility",
						options: () => formVisibility.value,
					},
				],
			},
			{
				elemType: "row",
				elems: [
					{
						elemType: "select",
						key: "floor",
						value: user?.floor.value,
						group: "dormitory",
						options: (s1: FormSelect, s2: FormSelect) => {
							if (
								s1.value !== undefined &&
								s2.value !== undefined
							) {
								return dormitory.value
									?.find((dorm) => dorm.value === s1.value)
									?.buildings.find(
										(building) =>
											building.value === s2.value
									)?.floors;
							}
							return [];
						},
					},
					{
						elemType: "select",
						key: "floorVisibility",
						value: user?.floor.visibility,
						group: "floorVisibility",
						options: () => formVisibility.value,
					},
				],
			},
			{
				elemType: "row",
				elems: [
					{
						elemType: "field",
						key: "room",
						type: "text",
						value: user?.room.value ?? "",
					},
					{
						elemType: "select",
						key: "roomVisibility",
						value: user?.room.visibility,
						group: "roomVisibility",
						options: () => formVisibility.value,
					},
				],
			},

			{ elemType: "separator", name: "Контакты", separator: true },
			...contacts(),
		],
	};
};
const form = ref<Form>(generateForm());

const onClickSave = () => {
	const fields = form.value.elems
		.filter(
			(elem) =>
				isFormField(elem) ||
				isFormDate(elem) ||
				isFormSelect(elem) ||
				isFormRow(elem)
		)
		.map((elem) => {
			if (isFormRow(elem)) {
				return elem.elems
					.filter(
						(rowElem) =>
							isFormField(rowElem) ||
							isFormDate(rowElem) ||
							isFormSelect(rowElem)
					)
					.map((rowElem) => {
						return {
							key: rowElem.key,
							value: rowElem.value,
						};
					});
			} else {
				return {
					key: elem.key,
					value: elem.value,
				};
			}
		})
		.flat();

	const getContacts = () => {
		const filterContacts = fields.filter((c) =>
			c.key.startsWith("contact")
		);
		const fieldContacts: {
			key: string;
			value: string;
			visibility: UserDataVisibility;
		}[] = [];

		for (let i = 0; i < filterContacts.length; i += 3) {
			fieldContacts.push({
				key: filterContacts[i]?.value as string,
				value: filterContacts[i + 1]?.value as string,
				visibility: filterContacts[i + 2]?.value as UserDataVisibility,
			});
		}

		return fieldContacts;
	};

	const newUser: User = {
		id: user?.id!,
		login: user?.login!,
		educationEmail: user?.educationEmail!,
		consentUserAgreement: user?.consentUserAgreement!,
		hei: user?.hei!,
		birthdate: {
			value: fields.find((f) => f.key === "birthdate")?.value as Date,
			visibility: fields.find((f) => f.key === "birthdateVisibility")
				?.value as UserDataVisibility,
		},
		dormitory: {
			value: fields.find((f) => f.key === "dormitory")?.value as string,
			visibility: fields.find((f) => f.key === "dormitoryVisibility")
				?.value as UserDataVisibility,
		},
		building: {
			value: fields.find((f) => f.key === "building")?.value as string,
			visibility: fields.find((f) => f.key === "buildingVisibility")
				?.value as UserDataVisibility,
		},
		floor: {
			value: fields.find((f) => f.key === "floor")?.value as string,
			visibility: fields.find((f) => f.key === "floorVisibility")
				?.value as UserDataVisibility,
		},
		room: {
			value: fields.find((f) => f.key === "room")?.value as string,
			visibility: fields.find((f) => f.key === "roomVisibility")
				?.value as UserDataVisibility,
		},
		surname: {
			value: fields.find((f) => f.key === "surname")?.value as string,
			visibility: fields.find((f) => f.key === "surnameVisibility")
				?.value as UserDataVisibility,
		},
		name: {
			value: fields.find((f) => f.key === "name")?.value as string,
			visibility: fields.find((f) => f.key === "nameVisibility")
				?.value as UserDataVisibility,
		},
		patronymic: {
			value: fields.find((f) => f.key === "patronymic")?.value as string,
			visibility: fields.find((f) => f.key === "patronymicVisibility")
				?.value as UserDataVisibility,
		},

		contacts: getContacts(),
	};

	$fetch("/api/user/self/settings", {
		method: "PUT",
		body: newUser,
	}).then(() => {
		refreshUser();
	});
};

const formKey = ref(0);
const onClickReset = async () => {
	form.value = generateForm();
	formKey.value++;
};
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.container">
			<UiAppear>
				<div :class="$style.forms">
					<FormComponent
						:key="formKey"
						:form="form"
						submit="Сохранить"
						button="Сбросить"
						@submit="onClickSave"
						@buttonClick="onClickReset"
					></FormComponent>
				</div>
			</UiAppear>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;

		.forms {
			.form {
				display: flex;
				column-gap: 20px;
			}
		}

		.tools {
			margin: auto;
			width: 400px;
			display: flex;
			justify-content: center;
			column-gap: 10px;

			.submit {
				width: 150px;
			}
		}
	}
}
</style>
