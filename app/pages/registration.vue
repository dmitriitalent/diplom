<script lang="ts" setup>
import {
	type Form,
	isFormCheckbox,
	isFormDate,
	isFormField,
	isFormSelect,
} from "~/components/types/Form";
import type { FormCheckbox } from "~/components/types/FormCheckbox";
import type { FormDate } from "~/components/types/FormDate";
import type { FormField } from "~/components/types/FormField";
import type { FormSelect } from "~/components/types/FormSelect";
import type { DormitroyDTO } from "~/dto/dormitory.dto";
import type { HeiDTO } from "~/dto/hei.dto";
import type { Dormitory } from "~/entities/Dormitory";
import { useAuthStore } from "~/stores/authStore";
import type { RegistrationDto } from "~/dto/registration.dto";
import type { DormitoryDtoGetList } from "~~/server/dto/dormitory/getList";
import { useDevice } from "~/composables/device";

definePageMeta({
	layout: "welcome",
});

const { deviceClassList } = useDevice();

const router = useRouter();

const { registration } = useAuthStore();

const { data: hei } = useAsyncData<Array<HeiDTO>>(
	async (_nuxtApp, { signal }) => {
		return $fetch("/api/hei/hei", { signal });
	},
);

const onClickRegistration = () => {
	console.log(
		(
			residentForm.value.elems.find(
				(el) => isFormSelect(el) && el.key === "dormitory",
			) as FormSelect | undefined
		)?.value,
	);

	const regData: RegistrationDto = {
		login: (
			form.value.elems.find(
				(el) => isFormField(el) && el.key === "login",
			) as FormField | undefined
		)?.value,
		password: (
			form.value.elems.find(
				(el) => isFormField(el) && el.key === "password",
			) as FormField | undefined
		)?.value,
		passwordConfirm: (
			form.value.elems.find(
				(el) => isFormField(el) && el.key === "passwordConfirm",
			) as FormField | undefined
		)?.value,
		educationEmail: (
			form.value.elems.find(
				(el) => isFormField(el) && el.key === "educationEmail",
			) as FormField | undefined
		)?.value,
		hei: (
			form.value.elems.find(
				(el) => isFormSelect(el) && el.key === "hei",
			) as FormSelect | undefined
		)?.value,
		birthdate: (
			form.value.elems.find(
				(el) => isFormDate(el) && el.key === "birthdate",
			) as FormDate | undefined
		)?.value,
		consentUserAgreement: (
			form.value.elems.find(
				(el) => isFormCheckbox(el) && el.key === "consentUserAgreement",
			) as FormCheckbox | undefined
		)?.value,
		surname: (
			residentForm.value.elems.find(
				(el) => isFormField(el) && el.key === "surname",
			) as FormField | undefined
		)?.value,
		name: (
			residentForm.value.elems.find(
				(el) => isFormField(el) && el.key === "name",
			) as FormField | undefined
		)?.value,
		patronymic: (
			residentForm.value.elems.find(
				(el) => isFormField(el) && el.key === "patronymic",
			) as FormField | undefined
		)?.value,
		dormitory: (
			residentForm.value.elems.find(
				(el) => isFormSelect(el) && el.key === "dormitory",
			) as FormSelect | undefined
		)?.value,
		building: (
			residentForm.value.elems.find(
				(el) => isFormSelect(el) && el.key === "building",
			) as FormSelect | undefined
		)?.value,
		floor: (
			residentForm.value.elems.find(
				(el) => isFormSelect(el) && el.key === "floor",
			) as FormSelect | undefined
		)?.value,
		room: (
			residentForm.value.elems.find(
				(el) => isFormField(el) && el.key === "room",
			) as FormField | undefined
		)?.value,
	};

	registration(regData).then(() => {
		router.push("/profile/self");
	});
};

const form = ref<Form>({
	title: "Регистрация",
	elems: [
		{
			elemType: "field",
			type: "text",
			key: "login",
			value: "",
			placeholder: "Логин",
			validator: (v: string) => v.length >= 6,
			required: true,
			leftIconName: "material-symbols:account-circle-full",
		},
		{
			elemType: "field",
			type: "password",
			key: "password",
			value: "",
			placeholder: "Пароль",
			validator: (v: string) => {
				const regex =
					/^(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
				return regex.test(v);
			},
			required: true,
			leftIconName: "carbon:password",
		},
		{
			elemType: "field",
			type: "password",
			key: "passwordConfirm",
			value: "",
			placeholder: "Подтвердите пароль",
			validator: (v: string): Boolean => {
				const password = form.value.elems.find((value) => {
					if (!isFormField(value)) {
						return false;
					}
					return value.key == "password";
				});

				if (!isFormField(password)) {
					return false;
				}

				return password !== undefined ? password.value === v : false;
			},
			required: true,
			leftIconName: "carbon:password",
		},
		{
			elemType: "field",
			type: "text",
			key: "educationEmail",
			value: "",
			placeholder: "Студенческая почта",
			validator: (v: string) => {
				const regex =
					/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
				return regex.test(v);
			},
			required: true,
			leftIconName: "material-symbols:mail-outline",
		},
		{
			elemType: "select",
			key: "hei",
			value: undefined,
			placeholder: "Учебное заведение",
			validator: (v: string) => {
				console.log(v);
				return v.length != 0;
			},
			required: true,
			leftIconName: "tdesign:education",
			options: () => {
				return hei.value;
			},
		},
		{
			elemType: "date",
			value: undefined,
			key: "birthdate",
			validator: (v: Date) => {
				return v != undefined;
			},
			placeholder: "Дата рождения",
			required: true,
			leftIconName: "cil:birthday-cake",
		},
		{
			elemType: "checkbox",
			value: undefined,
			key: "consentUserAgreement",
			required: true,
			name: "Я даю <a href='/agreement'>согласие на обработку моих персональных данных</a>",
		},
	],
});

const { data: dormitoriesFetch } = await useFetch<DormitoryDtoGetList>(
	"/api/dormitory/list",
);

const residentForm = ref<Form>({
	title: "Для проживающих",
	elems: [
		{
			elemType: "field",
			type: "text",
			key: "surname",
			value: "",
			placeholder: "Фамилия",
			validator: (v: string) => v.length != 0,
			required: true,
			leftIconName:
				"material-symbols:drive-file-rename-outline-outline-rounded",
		},
		{
			elemType: "field",
			type: "text",
			key: "name",
			value: "",
			placeholder: "Имя",
			validator: (v: string) => v.length != 0,
			required: true,
			leftIconName:
				"material-symbols:drive-file-rename-outline-outline-rounded",
		},
		{
			elemType: "field",
			type: "text",
			key: "patronymic",
			value: "",
			placeholder: "Отчество",
			validator: (v: string) => v.length != 0,
			required: true,
			leftIconName:
				"material-symbols:drive-file-rename-outline-outline-rounded",
		},
		{
			elemType: "select",
			key: "dormitory",
			value: "",
			placeholder: "Общежитие",
			validator: (v: string) => v.length != 0,
			required: true,
			leftIconName: "material-symbols:home-work-outline-rounded",
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
		{
			elemType: "field",
			type: "text",
			key: "building",
			value: "",
			placeholder: "Корпус",
			validator: (v: String) => v.length != 0,
			required: true,
			leftIconName: "material-symbols:home-work-outline-rounded",
		},
		{
			elemType: "field",
			type: "text",
			key: "floor",
			value: "",
			placeholder: "Этаж",
			validator: (v: String) => v.length != 0,
			required: true,
			leftIconName: "material-symbols:home-work-outline-rounded",
		},
		{
			elemType: "field",
			type: "text",
			key: "room",
			value: "",
			placeholder: "Комната",
			validator: (v: String) => v.length != 0,
			required: true,
			leftIconName: "material-symbols:home-work-outline-rounded",
		},
	],
});
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<div :class="$style.left">
				<UiAppear :delay="100">
					<FormComponent
						:class="$style.form"
						:form="form"
						submit="Зарегистрироваться"
						@submit="onClickRegistration"
					/>
				</UiAppear>
			</div>

			<div :class="$style.right">
				<UiAppear :delay="200">
					<FormComponent :class="$style.form" :form="residentForm" />
				</UiAppear>
			</div>
		</div>

		<UiAppear :delay="300">
			<div :class="$style.login">
				Уже есть аккаунт? —&nbsp
				<RouterLink to="/login">Войти</RouterLink>
			</div>
		</UiAppear>
	</div>
</template>

<style module lang="scss">
.wrapper {
	display: flex;
	flex-direction: column;
	align-items: center;
	row-gap: 50px;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);

	@include respond-to(mobile) {
		position: relative;
		top: auto;
		left: auto;
		transform: none;
		width: 100%;
		padding: 40px 16px;
		box-sizing: border-box;
		row-gap: 24px;
		align-items: stretch;
	}

	.container {
		display: flex;
		justify-content: center;
		align-items: flex-start;
		column-gap: 50px;
		width: 100%;

		@include respond-to(mobile) {
			flex-direction: column;
			column-gap: 0;
			row-gap: 24px;
		}
	}

	.left,
	.right {
		@include respond-to(mobile) {
			width: 100%;
		}
	}

	.form {
		@include color-white-bg(0.7);
		@include shadow;

		width: 500px;
		border-radius: 10px;

		@include respond-to(mobile) {
			width: 100%;
		}
	}

	.login {
		@include text-l;
		@include color-black;
		@include color-white-bg;

		padding: 10px;
		border-radius: 100px;
		box-shadow: 0 0 20px 20px $color-white;
		margin: auto;

		@include respond-to(mobile) {
			@include text-m;
		}
	}
}
</style>
