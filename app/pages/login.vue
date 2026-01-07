<script lang="ts" setup>
import type { FormField } from "~/components/types/FormField";
import { useAuthStore, type LoginDto } from "~/stores/authStore";

definePageMeta({
	layout: "welcome",
});

const router = useRouter();

const { login } = useAuthStore();

const onClickLogin = () => {
	const loginData: LoginDto = {
		login: studentFields.value[0]!.value,
		password: studentFields.value[1]!.value,
	};

	login(loginData).then(() => {
		router.push("/profile");
	});
};

const studentFields: Ref<Array<FormField>> = ref([
	{
		type: "text",
		key: "login",
		value: "",
		placeholder: "Логин",
		validator: (v: string) => v.length != 0,
		required: true,
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
	},
]);
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.container">
			<UiAppear>
				<FormComponent
					:class="$style.form"
					:fields="studentFields"
					button="Войти"
					@buttonClick="onClickLogin"
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
