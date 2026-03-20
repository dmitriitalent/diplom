<script setup lang="ts">
import {
	isFormDate,
	isFormField,
	isFormRow,
	isFormSelect,
	type Form,
} from "~/components/types/Form";
import type { FormRow } from "~/components/types/FormRow";
import type {
	FormSelect,
	FormSelectOption,
} from "~/components/types/FormSelect";
import type { DormitroyDTO } from "~/dto/dormitory.dto";
import type { Self, SelfDataVisibility } from "~/entities/Self";
import { useAuthStore } from "~/stores/authStore";

import { useSelfStore } from "~/stores/selfStore";

const router = useRouter();
const { logout } = useAuthStore();
const { self, updateSelf } = useSelfStore();
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
		return $fetch("/api/hei/dormitoriesByHei?hei=" + self?.hei, { signal });
	},
);

const addContact = () => {
	if (!self) {
		return;
	}

	self.contacts.push({
		key: "123",
		value: "1233131",
		visibility: "ADMIN",
	});
};

const contacts = (): Array<FormRow> => {
	if (!self?.contacts) {
		return [];
	}
	const rows: Array<FormRow> = self?.contacts.map((contact, index) => {
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
						value: self?.surname.value ?? "",
					},

					{
						elemType: "select",
						key: "surnameVisibility",
						value: self?.surname.visibility,
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
						value: self?.name.value ?? "",
					},

					{
						elemType: "select",
						key: "nameVisibility",
						value: self?.name.visibility,
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
						value: self?.patronymic.value ?? "",
					},

					{
						elemType: "select",
						key: "patronymicVisibility",
						value: self?.patronymic.visibility,
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
						value: self?.birthdate.value,
					},
					{
						elemType: "select",
						key: "birthdateVisibility",
						value: self?.birthdate.visibility,
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
						value: self?.dormitory.value,
						group: "dormitory",
						options: () => {
							return dormitory.value;
						},
					},
					{
						elemType: "select",
						key: "dormitoryVisibility",
						value: self?.dormitory.visibility,
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
						value: self?.building.value,
						group: "dormitory",
						options: (s1: FormSelect) => {
							if (s1.value !== undefined) {
								return dormitory.value?.find(
									(dorm) => dorm.value === s1.value,
								)?.buildings;
							}
							return [];
						},
					},
					{
						elemType: "select",
						key: "buildingVisibility",
						value: self?.building.visibility,
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
						value: self?.floor.value,
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
											building.value === s2.value,
									)?.floors;
							}
							return [];
						},
					},
					{
						elemType: "select",
						key: "floorVisibility",
						value: self?.floor.visibility,
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
						value: self?.room.value ?? "",
					},
					{
						elemType: "select",
						key: "roomVisibility",
						value: self?.room.visibility,
						group: "roomVisibility",
						options: () => formVisibility.value,
					},
				],
			},

			{ elemType: "separator", name: "Контакты", separator: true },
			...contacts(),
			{ elemType: "button", name: "Добавить", action: addContact },
			{
				elemType: "separator",
				name: "Кто видит список друзей",
				separator: true,
			},
			{
				elemType: "select",
				key: "friendsVisibility",
				value: self?.floor.visibility,
				group: "friendsVisibility",
				options: () => formVisibility.value,
			},
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
				isFormRow(elem),
		)
		.map((elem) => {
			if (isFormRow(elem)) {
				return elem.elems
					.filter(
						(rowElem) =>
							isFormField(rowElem) ||
							isFormDate(rowElem) ||
							isFormSelect(rowElem),
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
			c.key.startsWith("contact"),
		);
		const fieldContacts: {
			key: string;
			value: string;
			visibility: SelfDataVisibility;
		}[] = [];

		for (let i = 0; i < filterContacts.length; i += 3) {
			fieldContacts.push({
				key: filterContacts[i]?.value as string,
				value: filterContacts[i + 1]?.value as string,
				visibility: filterContacts[i + 2]?.value as SelfDataVisibility,
			});
		}

		return fieldContacts;
	};

	if (self === null || self === undefined) {
		console.log("Вы не авторизованны. Не старайтесь нас взламывать!");
		return;
	}

	const newSelf: Self = {
		id: self.id,
		login: self.login,
		educationEmail: self.educationEmail,
		consentUserAgreement: self.consentUserAgreement,
		hei: self.hei,
		birthdate: {
			value: fields.find((f) => f.key === "birthdate")?.value as Date,
			visibility: fields.find((f) => f.key === "birthdateVisibility")
				?.value as SelfDataVisibility,
		},
		dormitory: {
			value: fields.find((f) => f.key === "dormitory")?.value as string,
			visibility: fields.find((f) => f.key === "dormitoryVisibility")
				?.value as SelfDataVisibility,
		},
		building: {
			value: fields.find((f) => f.key === "building")?.value as string,
			visibility: fields.find((f) => f.key === "buildingVisibility")
				?.value as SelfDataVisibility,
		},
		floor: {
			value: fields.find((f) => f.key === "floor")?.value as string,
			visibility: fields.find((f) => f.key === "floorVisibility")
				?.value as SelfDataVisibility,
		},
		room: {
			value: fields.find((f) => f.key === "room")?.value as string,
			visibility: fields.find((f) => f.key === "roomVisibility")
				?.value as SelfDataVisibility,
		},
		surname: {
			value: fields.find((f) => f.key === "surname")?.value as string,
			visibility: fields.find((f) => f.key === "surnameVisibility")
				?.value as SelfDataVisibility,
		},
		name: {
			value: fields.find((f) => f.key === "name")?.value as string,
			visibility: fields.find((f) => f.key === "nameVisibility")
				?.value as SelfDataVisibility,
		},
		patronymic: {
			value: fields.find((f) => f.key === "patronymic")?.value as string,
			visibility: fields.find((f) => f.key === "patronymicVisibility")
				?.value as SelfDataVisibility,
		},

		friends: {
			value: self.friends.value,
			visibility: fields.find((f) => f.key === "friendsVisibility")
				?.value as SelfDataVisibility,
		},

		contacts: getContacts(),
	};

	updateSelf(newSelf);
};

const onClickLogout = () => {
	logout().then(() => {
		router.push("/welcome");
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

			<UiAppear>
				<UiButton :class="$style.logout" @click="onClickLogout"
					>Выйти</UiButton
				>
			</UiAppear>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;
		padding-bottom: 30px;

		.forms {
			.form {
				display: flex;
				column-gap: 20px;
			}
		}

		.logout {
			@include color-error-bg;

			width: 140px;
			margin: auto;
		}
	}
}
</style>
