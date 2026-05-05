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
import type { Dormitory } from "~/entities/Dormitory";
import type { Self } from "~/entities/Self";
import { useAuthStore } from "~/stores/authStore";

import { useSelfStore } from "~/stores/selfStore";
import type { DormitoryDtoGetList } from "~~/server/dto/dormitory/getList";
import type { SelfDataVisibility } from "~~/server/dto/selfDataVisibility.dto";

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

// ─── Contacts (managed outside FormComponent) ─────────────────────────────────

type LocalContact = {
	key: string;
	value: string;
	visibility: SelfDataVisibility;
	isPrimary: boolean;
};

const localContacts = ref<LocalContact[]>(
	(self?.contacts ?? []).map((c) => ({
		key: c.key ?? "",
		value: c.value ?? "",
		visibility: (c.visibility ?? "EVERYONE") as SelfDataVisibility,
		isPrimary: c.isPrimary ?? false,
	})),
);

const addContact = () => {
	localContacts.value.push({
		key: "",
		value: "",
		visibility: "EVERYONE",
		isPrimary: false,
	});
};

const deleteContact = (index: number) => {
	localContacts.value.splice(index, 1);
};

const setPrimary = (index: number) => {
	localContacts.value.forEach((c, i) => {
		c.isPrimary = i === index;
	});
};

// ─── Main form ────────────────────────────────────────────────────────────────

const { data: dormitoriesFetch } = await useFetch<DormitoryDtoGetList>(
	"/api/dormitory/list",
);

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
						value: self?.dormitory.id,
						placeholder: "Общежитие",
						validator: (v: string) => v.length != 0,
						required: true,
						leftIconName:
							"material-symbols:home-work-outline-rounded",
						group: "dormitory",
						options: () => {
							return (
								dormitoriesFetch.value?.items.map((d) => {
									return {
										name: d.address,
										value: d.id,
									};
								}) ?? []
							);
						},
					},
				],
			},

			{
				elemType: "row",
				elems: [
					{
						elemType: "field",
						type: "text",
						key: "building",
						value: self?.building.value ?? "",
						placeholder: "Корпус",
						validator: (v: String) => v.length != 0,
						required: true,
						leftIconName:
							"material-symbols:home-work-outline-rounded",
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
						elemType: "field",
						type: "text",
						key: "floor",
						value: self?.floor.value ?? "",
						placeholder: "Этаж",
						validator: (v: String) => v.length != 0,
						required: true,
						leftIconName:
							"material-symbols:home-work-outline-rounded",
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

	if (self === null || self === undefined) {
		console.log("Вы не авторизованны. Не старайтесь нас взламывать!");
		return;
	}

	const newSelf: Self = {
		id: self.id,
		login: self.login,
		educationEmail: self.educationEmail,
		birthdate: {
			value: fields.find((f) => f.key === "birthdate")?.value as Date,
			visibility: fields.find((f) => f.key === "birthdateVisibility")
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

		dormitory: {} as Dormitory,

		friends: [] as Array<{
			friendId: string;
			status: string;
		}>,

		contacts: localContacts.value,
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
	localContacts.value = (self?.contacts ?? []).map((c) => ({
		key: c.key ?? "",
		value: c.value ?? "",
		visibility: (c.visibility ?? "EVERYONE") as SelfDataVisibility,
		isPrimary: c.isPrimary ?? false,
	}));
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

			<!-- Contacts section -->
			<UiAppear>
				<div :class="$style.contactsSection">
					<div :class="$style.contactsSeparator">Контакты</div>

					<div
						v-for="(contact, i) in localContacts"
						:key="i"
						:class="$style.contactRow"
					>
						<label :class="$style.radioLabel" :title="contact.isPrimary ? 'Предпочитаемый контакт' : 'Сделать предпочитаемым'">
							<input
								type="radio"
								name="primaryContact"
								:checked="contact.isPrimary"
								:class="$style.radio"
								@change="setPrimary(i)"
							/>
							<span :class="[$style.radioCustom, contact.isPrimary && $style.radioCustomActive]">
								<Icon v-if="contact.isPrimary" name="mdi:star" :class="$style.starIcon" />
								<Icon v-else name="mdi:star-outline" :class="$style.starIcon" />
							</span>
						</label>

						<UiInput
							v-model="localContacts[i].key"
							type="text"
							placeholder="Тип (telegram, phone...)"
							:class="$style.contactKey"
						/>
						<UiInput
							v-model="localContacts[i].value"
							type="text"
							placeholder="Значение"
							:class="$style.contactValue"
						/>
						<UiSelect
							v-model="localContacts[i].visibility"
							:options="formVisibility"
							:class="$style.contactVisibility"
						/>
						<UiButton
							:class="$style.contactDelete"
							@click="deleteContact(i)"
						>
							<Icon name="material-symbols:delete-outline" :class="$style.deleteIcon" />
						</UiButton>
					</div>

					<UiButton :class="$style.addContactBtn" inset @click="addContact">
						<Icon name="material-symbols:add" :class="$style.addIcon" />
						Добавить контакт
					</UiButton>
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

		display: flex;
		flex-direction: column;
		row-gap: 20px;

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

// ── Contacts section ──────────────────────────────────────────────────────────

.contactsSection {
	display: flex;
	flex-direction: column;
	row-gap: 8px;
}

.contactsSeparator {
	@include title-s;
	@include color-black;

	padding: 8px 0 4px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	margin-bottom: 4px;
}

.contactRow {
	display: flex;
	align-items: center;
	column-gap: 8px;
}

.radioLabel {
	display: flex;
	align-items: center;
	cursor: pointer;
	flex-shrink: 0;

	.radio {
		display: none;
	}

	.radioCustom {
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.35;
		transition: opacity $transition-fast;

		&:hover {
			opacity: 0.7;
		}

		&.radioCustomActive {
			opacity: 1;
		}

		.starIcon {
			width: 20px;
			height: 20px;
			color: #f5a623;
		}
	}
}

.contactKey {
	width: 180px;
	flex-shrink: 0;
}

.contactValue {
	flex: 1;
}

.contactVisibility {
	width: 150px;
	flex-shrink: 0;
}

.contactDelete {
	@include color-error-bg;

	flex-shrink: 0;
	padding: 6px;

	.deleteIcon {
		width: 18px;
		height: 18px;
	}
}

.addContactBtn {
	width: fit-content;

	.addIcon {
		width: 16px;
		height: 16px;
		margin-right: 4px;
	}
}
</style>
