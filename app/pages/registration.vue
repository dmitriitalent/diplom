<script lang="ts" setup>
import type { HeiDTO } from "~/dto/hei.dto";
import { useAuthStore } from "~/stores/authStore";
import { useDevice } from "~/composables/device";
import type { DormitoryDtoGetList } from "~~/server/dto/dormitory/getList";
import type { RegistrationDto } from "~/dto/registration.dto";

definePageMeta({
	layout: "welcome",
});

const { deviceClassList } = useDevice();
const router = useRouter();
const { registration } = useAuthStore();

// ─── Remote data ──────────────────────────────────────────────────────────────

const { data: heiList } = await useAsyncData<Array<HeiDTO>>(
	async (_nuxtApp, { signal }) => $fetch("/api/hei/hei", { signal }),
);

const { data: dormitoriesFetch } = await useFetch<DormitoryDtoGetList>(
	"/api/dormitory/list",
);

const dormitoryOptions = computed(
	() =>
		dormitoriesFetch.value?.items.map((d) => ({
			name: d.address,
			value: d.id,
		})) ?? [],
);

// ─── Form state ───────────────────────────────────────────────────────────────

const form = reactive({
	// Учётная запись
	login: "",
	password: "",
	passwordConfirm: "",
	educationEmail: "",

	// Как вас зовут
	surname: "",
	name: "",
	patronymic: "",

	// Учёба
	hei: undefined as string | undefined,
	birthdate: undefined as Date | undefined,

	// Для проживающих
	dormitory: undefined as string | undefined,
	building: "",
	floor: "",
	room: "",

	// Согласие
	consentUserAgreement: false,
});

// ─── Validation ───────────────────────────────────────────────────────────────

const errors = reactive({
	login: false,
	password: false,
	passwordConfirm: false,
	educationEmail: false,
	birthdate: false,
	consent: false,
});

const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
const emailRegex =
	/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const validate = () => {
	errors.login = form.login.length < 6;
	errors.password = !passwordRegex.test(form.password);
	errors.passwordConfirm = form.password !== form.passwordConfirm;
	errors.educationEmail = !emailRegex.test(form.educationEmail);
	errors.birthdate = !form.birthdate;
	errors.consent = !form.consentUserAgreement;
	return (
		!errors.login &&
		!errors.password &&
		!errors.passwordConfirm &&
		!errors.educationEmail &&
		!errors.birthdate &&
		!errors.consent
	);
};

// ─── Submit ───────────────────────────────────────────────────────────────────

const submitError = ref("");
const loading = ref(false);

const onSubmit = async () => {
	if (!validate()) return;
	if (loading.value) return;

	submitError.value = "";
	loading.value = true;

	const regData: RegistrationDto = {
		login: form.login,
		password: form.password,
		passwordConfirm: form.passwordConfirm,
		educationEmail: form.educationEmail,
		hei: form.hei,
		birthdate: form.birthdate,
		consentUserAgreement: form.consentUserAgreement,
		surname: form.surname,
		name: form.name,
		patronymic: form.patronymic,
		dormitory: form.dormitory,
		building: form.building,
		floor: form.floor,
		room: form.room,
	};

	try {
		await registration(regData);
		router.push("/profile/self");
	} catch (err: any) {
		submitError.value =
			err?.data?.message ?? err?.message ?? "Ошибка при регистрации";
	} finally {
		loading.value = false;
	}
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<UiAppear>
			<form :class="$style.card" @submit.prevent="onSubmit">
				<h1 :class="$style.title">Регистрация</h1>

				<!-- Ошибка -->
				<UiTransition name="fade-top">
					<div v-if="submitError" :class="$style.notifyError">
						<Icon
							name="mdi:alert-circle-outline"
							:class="$style.notifyIcon"
						/>
						<span>{{ submitError }}</span>
					</div>
				</UiTransition>

				<!-- ── Учётная запись ──────────────────────────────────── -->
				<div :class="$style.section">
					<div :class="$style.sectionTitle">Учётная запись</div>

					<div :class="$style.fieldGroup">
						<UiInput
							v-model="form.login"
							placeholder="Логин"
							left-icon-name="material-symbols:account-circle-full"
							autocomplete="username"
							:status="errors.login ? 'error' : undefined"
							@blur="errors.login = form.login.length < 6"
						/>
						<span v-if="errors.login" :class="$style.errorMsg">
							Логин должен содержать минимум 6 символов
						</span>
					</div>

					<div :class="$style.fieldGroup">
						<UiInput
							v-model="form.password"
							type="password"
							placeholder="Пароль"
							left-icon-name="carbon:password"
							autocomplete="new-password"
							:status="errors.password ? 'error' : undefined"
							@blur="errors.password = !passwordRegex.test(form.password)"
						/>
						<span :class="[$style.hint, errors.password && $style.hintError]">
							Минимум 6 символов, хотя бы одна цифра и один спецсимвол (!@#$%^&*)
						</span>
					</div>

					<div :class="$style.fieldGroup">
						<UiInput
							v-model="form.passwordConfirm"
							type="password"
							placeholder="Подтвердите пароль"
							left-icon-name="carbon:password"
							autocomplete="new-password"
							:status="errors.passwordConfirm ? 'error' : undefined"
							@blur="errors.passwordConfirm = form.password !== form.passwordConfirm"
						/>
						<span v-if="errors.passwordConfirm" :class="$style.errorMsg">
							Пароли не совпадают
						</span>
					</div>

					<div :class="$style.fieldGroup">
						<UiInput
							v-model="form.educationEmail"
							placeholder="Студенческая почта"
							left-icon-name="material-symbols:mail-outline"
							:status="errors.educationEmail ? 'error' : undefined"
							@blur="errors.educationEmail = !emailRegex.test(form.educationEmail)"
						/>
						<span v-if="errors.educationEmail" :class="$style.errorMsg">
							Введите корректный email
						</span>
					</div>
				</div>

				<!-- ── Как вас зовут ───────────────────────────────────── -->
				<div :class="$style.section">
					<div :class="$style.sectionTitle">Как вас зовут</div>

					<div :class="$style.row">
						<UiInput
							v-model="form.surname"
							placeholder="Фамилия"
							left-icon-name="material-symbols:drive-file-rename-outline-outline-rounded"
						/>
						<UiInput
							v-model="form.name"
							placeholder="Имя"
							left-icon-name="material-symbols:drive-file-rename-outline-outline-rounded"
						/>
					</div>

					<UiInput
						v-model="form.patronymic"
						placeholder="Отчество"
						left-icon-name="material-symbols:drive-file-rename-outline-outline-rounded"
					/>
				</div>

				<!-- ── Учёба ───────────────────────────────────────────── -->
				<div :class="$style.section">
					<div :class="$style.sectionTitle">Учёба</div>

					<div :class="$style.row">
						<UiSelect
							v-model="form.hei"
							:options="heiList ?? []"
							placeholder="Учебное заведение"
							left-icon-name="tdesign:education"
						/>
						<div :class="$style.fieldGroup">
							<ClientOnly>
								<UiDatePicker
									v-model="form.birthdate"
									placeholder="Дата рождения"
									left-icon-name="cil:birthday-cake"
									:enable-time="false"
									@update:model-value="errors.birthdate = false"
								/>
							</ClientOnly>
							<span v-if="errors.birthdate" :class="$style.errorMsg">
								Укажите дату рождения
							</span>
						</div>
					</div>
				</div>

				<!-- ── Для проживающих ────────────────────────────────── -->
				<div :class="$style.section">
					<div :class="$style.sectionTitle">Для проживающих</div>

					<UiSelect
						v-model="form.dormitory"
						:options="dormitoryOptions"
						placeholder="Общежитие"
						left-icon-name="material-symbols:home-work-outline-rounded"
					/>

					<div :class="$style.row">
						<UiInput
							v-model="form.building"
							placeholder="Корпус"
							left-icon-name="material-symbols:home-work-outline-rounded"
						/>
						<UiInput
							v-model="form.floor"
							placeholder="Этаж"
							left-icon-name="material-symbols:home-work-outline-rounded"
						/>
					</div>

					<UiInput
						v-model="form.room"
						placeholder="Комната"
						left-icon-name="material-symbols:home-work-outline-rounded"
					/>
				</div>

				<!-- ── Согласие и кнопка ───────────────────────────────── -->
				<label
					:class="[
						$style.consent,
						errors.consent && $style.consentError,
					]"
				>
					<input
						v-model="form.consentUserAgreement"
						type="checkbox"
						:class="$style.consentCheckbox"
						@change="errors.consent = false"
					/>
					<span :class="$style.consentText">
						Я даю
						<RouterLink to="/agreement" :class="$style.consentLink">
							согласие на обработку моих персональных данных
						</RouterLink>
					</span>
				</label>

				<UiButton
					accent
					type="submit"
					:disabled="loading"
					:class="$style.submitBtn"
					@click="onSubmit"
				>
					{{ loading ? "Регистрация..." : "Зарегистрироваться" }}
				</UiButton>

				<div :class="$style.loginLink">
					Уже есть аккаунт?&nbsp;—&nbsp;
					<RouterLink to="/login" :class="$style.loginLinkA"
						>Войти</RouterLink
					>
				</div>
			</form>
		</UiAppear>
	</div>
</template>

<style module lang="scss">
.wrapper {
	display: flex;
	align-items: flex-start;
	justify-content: center;
	min-height: 100dvh;
	padding: 40px 16px;
	box-sizing: border-box;

	@include respond-to(mobile) {
		padding: 24px 12px;
	}

	.card {
		@include color-white-bg(0.72);
		@include shadow;

		width: 100%;
		max-width: 680px;
		border-radius: 16px;
		padding: 40px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		row-gap: 24px;
		backdrop-filter: blur(12px);

		@include respond-to(mobile) {
			padding: 24px 16px;
			row-gap: 20px;
		}

		.title {
			@include reset;
			@include title-m;
			@include color-black;
		}

		// ── Уведомления ──────────────────────────────────────────

		.notifyError {
			@include text-m;
			@include color-black;
			@include color-error-bg;

			display: flex;
			align-items: center;
			column-gap: 10px;
			padding: 14px 18px;
			border-radius: 10px;

			.notifyIcon {
				width: 20px;
				height: 20px;
				flex-shrink: 0;
			}
		}

		// ── Секции ───────────────────────────────────────────────

		.section {
			display: flex;
			flex-direction: column;
			row-gap: 10px;

			.sectionTitle {
				@include text-s;
				@include color-black;

				opacity: 0.4;
				text-transform: uppercase;
				letter-spacing: 0.08em;
				padding-bottom: 8px;
				border-bottom: 1px solid rgba($color-black-rgb, 0.1);
				margin-bottom: 2px;
			}
		}

		// ── Поле с сообщением ────────────────────────────────────

		.fieldGroup {
			display: flex;
			flex-direction: column;
			row-gap: 4px;
		}

		.hint {
			@include text-s;
			@include color-black;

			opacity: 0.45;
			padding-left: 4px;

			&.hintError {
				@include color-error;

				opacity: 1;
			}
		}

		.errorMsg {
			@include text-s;
			@include color-error;

			padding-left: 4px;
		}

		// ── Сетка ────────────────────────────────────────────────

		.row {
			display: grid;
			grid-template-columns: 1fr 1fr;
			column-gap: 10px;

			@include respond-to(mobile) {
				grid-template-columns: 1fr;
				row-gap: 10px;
			}
		}

		// ── Согласие ─────────────────────────────────────────────

		.consentError {
			.consentText {
				@include color-error;
			}
		}

		.consent {
			display: flex;
			align-items: flex-start;
			column-gap: 10px;
			cursor: pointer;

			.consentCheckbox {
				margin-top: 2px;
				flex-shrink: 0;
				width: 16px;
				height: 16px;
				cursor: pointer;
				accent-color: $color-accent;
			}

			.consentText {
				@include text-m;
				@include color-black;

				line-height: 1.5;
			}

			.consentLink {
				@include color-accent;

				text-decoration: underline;
			}
		}

		// ── Кнопка регистрации ───────────────────────────────────

		.submitBtn {
			width: 100%;
			box-sizing: border-box;
		}

		// ── Ссылка на вход ───────────────────────────────────────

		.loginLink {
			@include text-m;
			@include color-black;

			text-align: center;
			opacity: 0.7;

			.loginLinkA {
				@include color-accent;

				text-decoration: underline;
			}
		}
	}
}
</style>
