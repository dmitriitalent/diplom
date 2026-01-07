<script lang="ts" setup>
import type { FormField } from "~/components/types/FormField";
import { useAuthStore } from "~/stores/authStore";
import type { RegistrationDto } from "~/stores/authStore/registration.dto";

definePageMeta({
	layout: "welcome",
});

const router = useRouter();

const { registration } = useAuthStore();

const onClickRegistration = () => {
	const regData: RegistrationDto = {
		login: studentFields.value[0]!.value,
		password: studentFields.value[1]!.value,
		passwordConfirm: studentFields.value[2]!.value,
		educationEmail: studentFields.value[3]!.value,
		hei: studentFields.value[4]!.value,
		birthdate: studentFields.value[5]!.date!,
		phone: studentFields.value[6]!.value,
		dormitory: residentFields.value[0]!.value,
		building: residentFields.value[1]!.value,
		floor: residentFields.value[2]!.value,
		room: residentFields.value[3]!.value,
		surname: residentFields.value[4]!.value,
		name: residentFields.value[5]!.value,
		patronymic: residentFields.value[6]!.value,
	};

	registration(regData).then(() => {
		router.push("/profile");
	});
};

const studentFields: Ref<Array<FormField>> = ref([
	{
		type: "text",
		key: "login",
		value: "",
		placeholder: "Логин",
		validator: (v: string) => v.length >= 6,
		required: true,
		leftIconName: "material-symbols:account-circle-full",
	},
	{
		type: "password",
		key: "password",
		value: "",
		placeholder: "Пароль",
		validator: (v: string) => {
			const regex = /^(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
			return regex.test(v);
		},
		required: true,
		leftIconName: "carbon:password",
	},
	{
		type: "password",
		key: "passwordConfirm",
		value: "",
		placeholder: "Подтвердите пароль",
		validator: (v: string) => {
			const password = studentFields.value.find(
				(value) => value.key == "password"
			)?.value;

			return password !== undefined ? password === v : false;
		},
		required: true,
		leftIconName: "carbon:password",
	},
	{
		type: "text",
		key: "educationEmail",
		value: "",
		separatorTop: true,
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
		type: "select",
		key: "hei",
		value: "",
		placeholder: "Учебное заведение",
		validator: (v: string) => v.length != 0,
		required: true,
		leftIconName: "tdesign:education",
		selectOptions: [
			{
				name: "МАИ (Московский Авиационный Институт)",
				value: "mai",
				leftIconName: "tdesign:education",
			},
		],
	},
	{
		type: "date",
		key: "birthdate",
		value: "",
		validator: (v: Date) => {
			return v != undefined;
		},
		separatorTop: true,
		placeholder: "Дата рождения",
		required: true,
		leftIconName: "cil:birthday-cake",
	},
	{
		type: "text",
		key: "phone",
		value: "",
		placeholder: "Номер телефона",
		validator: (v: string) => v.length != 0,
		required: true,
		leftIconName: "material-symbols:call-outline",
	},
]);

const residentFields: Ref<Array<FormField>> = ref([
	{
		type: "select",
		key: "dormitory",
		value: "",
		placeholder: "Общежитие",
		validator: (v: String) => v.length != 0,
		required: true,
		leftIconName: "material-symbols:home-work-outline-rounded",
		selectOptions: [
			{
				name: "Икар (г. Москва, ул. Дубосековская, д. 13)",
				value: "icar",
				leftIconName: "material-symbols:home-work-outline-rounded",
			},
		],
	},
	{
		type: "select",
		key: "building",
		value: "",
		placeholder: "Корпус",
		validator: (v: String) => v.length != 0,
		required: true,
		leftIconName: "material-symbols:home-work-outline-rounded",
		selectOptions: [
			{
				name: "1",
				value: "1",
				leftIconName: "material-symbols:home-work-outline-rounded",
			},
			{
				name: "2",
				value: "2",
				leftIconName: "material-symbols:home-work-outline-rounded",
			},
		],
	},
	{
		type: "select",
		key: "floor",
		value: "",
		placeholder: "Этаж",
		validator: (v: String) => v.length != 0,
		required: true,
		leftIconName: "material-symbols:home-work-outline-rounded",
		selectOptions: [
			{
				name: "1",
				value: "1",
				leftIconName: "material-symbols:home-work-outline-rounded",
			},
			{
				name: "2",
				value: "2",
				leftIconName: "material-symbols:home-work-outline-rounded",
			},
			{
				name: "3",
				value: "3",
				leftIconName: "material-symbols:home-work-outline-rounded",
			},
			{
				name: "4",
				value: "4",
				leftIconName: "material-symbols:home-work-outline-rounded",
			},
			{
				name: "5",
				value: "5",
				leftIconName: "material-symbols:home-work-outline-rounded",
			},
		],
	},
	{
		type: "text",
		key: "room",
		value: "",
		placeholder: "Комната",
		validator: (v: String) => v.length != 0,
		required: true,
		leftIconName: "material-symbols:home-work-outline-rounded",
	},
	{
		type: "text",
		key: "surname",
		value: "",
		separatorTop: true,
		placeholder: "Фамилия",
		validator: (v: string) => v.length != 0,
		required: true,
		leftIconName:
			"material-symbols:drive-file-rename-outline-outline-rounded",
	},
	{
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
		type: "text",
		key: "patronymic",
		value: "",
		placeholder: "Отчество",
		validator: (v: string) => v.length != 0,
		required: true,
		leftIconName:
			"material-symbols:drive-file-rename-outline-outline-rounded",
	},
]);
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.container">
			<div :class="$style.left">
				<UiAppear :delay="100">
					<FormComponent
						:class="$style.form"
						:fields="studentFields"
						button="Зарегистрироваться"
						@buttonClick="onClickRegistration"
					/>
				</UiAppear>
			</div>

			<div :class="$style.right">
				<UiAppear :delay="200">
					<FormComponent
						:class="$style.form"
						:fields="residentFields"
						title="Поля для проживающих"
					/>
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

	.container {
		display: flex;
		justify-content: center;
		align-items: center;
		column-gap: 50px;
		width: 100%;
	}

	.form {
		@include color-white-bg(0.7);
		@include shadow;

		width: 500px;
		border-radius: 10px;
	}

	.login {
		@include text-l;
		@include color-black;
		@include color-white-bg;

		padding: 10px;
		border-radius: 100px;
		box-shadow: 0 0 20px 20px $color-white;
		margin: auto;
	}
}
</style>
