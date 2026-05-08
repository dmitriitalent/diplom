<script lang="ts" setup>
import { isFormField, type Form } from "~/components/types/Form";
import type { FormField } from "~/components/types/FormField";
import type { Status } from "~/components/types/Status";
import { useDevice } from "~/composables/device";
import { useAuthStore, type LoginDto } from "~/stores/authStore";

definePageMeta({
	layout: "welcome",
});

const { deviceClassList } = useDevice();

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

	login(loginData)
		.then(() => {
			errorText.value = "";
			errorLoginStatus.value = "success";
			errorPasswordStatus.value = "success";
			router.push("/profile/self");
		})
		.catch((err) => {
			if (err.statusCode === 401) {
				errorText.value = "Неверный логин или пароль";
				errorLoginStatus.value = "error";
				errorPasswordStatus.value = "error";
			}
			if (err.statusCode === 500) {
				errorText.value = "Ошибка сервера :(";
				errorLoginStatus.value = "error";
				errorPasswordStatus.value = "error";
			}
		});
};

const errorText = ref("");
const errorLoginStatus = ref<Status>("ok");
const errorPasswordStatus = ref<Status>("ok");
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
			status: errorLoginStatus,
		},
		{
			elemType: "field",
			type: "password",
			key: "password",
			value: "",
			placeholder: "Пароль",
			required: true,
			leftIconName: "carbon:password",
			status: errorPasswordStatus,
		},
	],
});
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<UiAppear>
				<div :class="$style.form">
					<FormComponent
						:form="form"
						submit="Войти"
						@submit="onClickLogin"
					/>

					<h1 v-if="errorText" :class="$style.error">
						{{ errorText }}
					</h1>
				</div>
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

	@include respond-to(mobile) {
		position: relative;
		top: auto;
		left: auto;
		transform: none;
		width: 100%;
		min-height: 100dvh;
		justify-content: center;
		padding: 40px 16px;
		box-sizing: border-box;
		row-gap: 32px;
	}

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
		overflow: hidden;

		@include respond-to(mobile) {
			width: 100%;
		}
	}

	.error {
		@include reset;
		@include text-m;
		@include color-black;
		@include color-error-bg;

		text-align: center;
		padding: 20px;
	}

	.registration {
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
