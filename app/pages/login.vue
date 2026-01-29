<script lang="ts" setup>
import { isFormField, type Form } from "~/components/types/Form";
import type { FormField } from "~/components/types/FormField";
import { useAuthStore, type LoginDto } from "~/stores/authStore";

definePageMeta({
	layout: "welcome",
});

const router = useRouter();

const { login } = useAuthStore();

const onClickLogin = () => {
	const loginData: LoginDto = {
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
	};

	login(loginData).then(() => {
		console.log(loginData);
		router.push("/profile/self");
	});
};

const form: Ref<Form> = ref({
	title: "Вход",
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
			required: true,
			leftIconName: "carbon:password",
		},
	],
});
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.container">
			<UiAppear>
				<FormComponent
					:class="$style.form"
					:form="form"
					submit="Войти"
					@submit="onClickLogin"
				/>
			</UiAppear>
		</div>

		<UiAppear :delay="200">
			<div :class="$style.registration">
				Нет аккаунта? —&nbsp<RouterLink to="/registration"
					>Регистрация</RouterLink
				>
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

	.registration {
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
