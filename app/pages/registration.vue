<script lang="ts" setup>
useSeoMeta({
	title: "Регистрация",
	description:
		"Зарегистрируйтесь в Hostelite — сервисе для проживающих общежития.",
	robots: "noindex, nofollow",
});

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
	login: "",
	password: "",
	passwordConfirm: "",
	educationEmail: "",
	surname: "",
	name: "",
	patronymic: "",
	hei: undefined as string | undefined,
	birthdate: undefined as Date | undefined,
	dormitory: undefined as string | undefined,
	building: "",
	floor: "",
	room: "",
	vk: "",
	consentUserAgreement: false,
});

const isResident = ref(false);

// ─── Email verification state ─────────────────────────────────────────────────

const studentEmailRegex = /^[^@]+@mai\.education$/i;

const emailCodeSent = ref(false);
const emailVerified = ref(false);
const verificationCode = ref("");
const codeSending = ref(false);
const codeVerifying = ref(false);
const sendCodeError = ref("");
const verifyCodeError = ref("");
const resendCooldown = ref(0);
let resendTimer: ReturnType<typeof setInterval> | null = null;

const isValidStudentEmail = computed(() =>
	studentEmailRegex.test(form.educationEmail.trim()),
);

watch(
	() => form.educationEmail,
	(newVal, oldVal) => {
		if (newVal !== oldVal && (emailCodeSent.value || emailVerified.value)) {
			resetEmailVerification();
		}
	},
);

const resetEmailVerification = () => {
	emailCodeSent.value = false;
	emailVerified.value = false;
	verificationCode.value = "";
	sendCodeError.value = "";
	verifyCodeError.value = "";
	if (resendTimer) {
		clearInterval(resendTimer);
		resendTimer = null;
		resendCooldown.value = 0;
	}
};

const startResendCooldown = () => {
	resendCooldown.value = 60;
	resendTimer = setInterval(() => {
		resendCooldown.value--;
		if (resendCooldown.value <= 0) {
			clearInterval(resendTimer!);
			resendTimer = null;
		}
	}, 1000);
};

const onSendCode = async () => {
	if (codeSending.value || resendCooldown.value > 0) return;
	if (!isValidStudentEmail.value) {
		sendCodeError.value = "Введите корректную студенческую почту @mai.education";
		return;
	}

	codeSending.value = true;
	sendCodeError.value = "";

	try {
		await $fetch("/api/auth/send-verification-code", {
			method: "POST",
			body: { email: form.educationEmail.trim().toLowerCase() },
		});
		emailCodeSent.value = true;
		startResendCooldown();
	} catch (err: any) {
		sendCodeError.value = err?.data?.message ?? "Не удалось отправить код";
	} finally {
		codeSending.value = false;
	}
};

const onVerifyCode = async () => {
	if (codeVerifying.value) return;
	if (!verificationCode.value.trim()) {
		verifyCodeError.value = "Введите код из письма";
		return;
	}

	codeVerifying.value = true;
	verifyCodeError.value = "";

	try {
		await $fetch("/api/auth/verify-code", {
			method: "POST",
			body: {
				email: form.educationEmail.trim().toLowerCase(),
				code: verificationCode.value.trim(),
			},
		});
		emailVerified.value = true;
	} catch (err: any) {
		verifyCodeError.value = err?.data?.message ?? "Неверный код";
	} finally {
		codeVerifying.value = false;
	}
};

onBeforeUnmount(() => {
	if (resendTimer) clearInterval(resendTimer);
});

// ─── Validation ───────────────────────────────────────────────────────────────

const errors = reactive({
	login: false,
	password: false,
	passwordConfirm: false,
	educationEmail: false,
	birthdate: false,
	vk: false,
	consent: false,
});

const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;

// Допустимый VK-контакт: @handle, handle или vk.com/... ссылка.
// Минимум 2 значимых символа после "@" / в URL pathname.
const vkContactRegex =
	/^(@?[A-Za-z0-9._-]{2,}|https?:\/\/(www\.)?vk\.com\/[A-Za-z0-9._-]{2,}\/?.*)$/i;

const validate = () => {
	errors.login = form.login.length < 6;
	errors.password = !passwordRegex.test(form.password);
	errors.passwordConfirm = form.password !== form.passwordConfirm;
	errors.educationEmail = !studentEmailRegex.test(form.educationEmail);
	errors.birthdate = !form.birthdate;
	errors.vk = isResident.value && !vkContactRegex.test(form.vk.trim());
	errors.consent = !form.consentUserAgreement;
	return (
		!errors.login &&
		!errors.password &&
		!errors.passwordConfirm &&
		!errors.educationEmail &&
		!errors.birthdate &&
		!errors.vk &&
		!errors.consent
	);
};

// ─── Submit ───────────────────────────────────────────────────────────────────

const submitError = ref("");
const loading = ref(false);

const onSubmit = async () => {
	if (!emailVerified.value) {
		submitError.value = "Сначала подтвердите студенческую почту";
		return;
	}
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
		isResident: isResident.value,
		surname: form.surname,
		name: form.name,
		patronymic: form.patronymic,
		dormitory: form.dormitory,
		building: form.building,
		floor: form.floor,
		room: form.room,
		// Для резидентов: VK обязателен и сохраняется как primary-контакт.
		vkContact: isResident.value ? form.vk.trim() : undefined,
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

					<!-- ── Студенческая почта + верификация ── -->
					<div :class="$style.fieldGroup">
						<UiInput
							v-model="form.educationEmail"
							placeholder="Студенческая почта"
							left-icon-name="material-symbols:mail-outline"
							:status="errors.educationEmail ? 'error' : undefined"
							:disabled="emailVerified"
							@blur="errors.educationEmail = !studentEmailRegex.test(form.educationEmail)"
						/>
						<span v-if="errors.educationEmail" :class="$style.errorMsg">
							Введите почту в формате *@mai.education
						</span>
						<span v-if="!errors.educationEmail && !emailVerified" :class="$style.hint">
							Только адреса вида <strong>*@mai.education</strong>
						</span>

						<!-- Кнопка отправки кода (до отправки) -->
						<template v-if="!emailCodeSent && !emailVerified">
							<button
								type="button"
								:class="[
									$style.sendCodeBtn,
									(!isValidStudentEmail || codeSending || resendCooldown > 0) && $style.sendCodeBtnDisabled,
								]"
								:disabled="!isValidStudentEmail || codeSending || resendCooldown > 0"
								@click="onSendCode"
							>
								<Icon
									:name="codeSending ? 'mdi:loading' : 'mdi:email-send-outline'"
									:class="[$style.sendCodeIcon, codeSending && $style.spinning]"
								/>
								{{ codeSending ? "Отправка..." : "Получить код верификации" }}
							</button>
							<span v-if="sendCodeError" :class="$style.errorMsg">
								{{ sendCodeError }}
							</span>
						</template>

						<!-- Ввод кода (после отправки, до верификации) -->
						<template v-if="emailCodeSent && !emailVerified">
							<div :class="$style.codeSection">
								<div :class="$style.codeHint">
									<Icon name="mdi:email-check-outline" :class="$style.codeHintIcon" />
									Код отправлен на <strong>{{ form.educationEmail }}</strong>
								</div>

								<UiInput
									v-model="verificationCode"
									placeholder="Введите код из письма"
									left-icon-name="mdi:key-outline"
									:status="verifyCodeError ? 'error' : undefined"
								/>

								<div :class="$style.mailLinkRow">
									<Icon name="mdi:open-in-new" :class="$style.mailLinkIcon" />
									<a
										href="https://mail.mai.education/"
										target="_blank"
										rel="noopener noreferrer"
										:class="$style.mailLink"
									>
										Открыть почту МАИ
									</a>
									<span :class="$style.mailLinkHint">
										(если не пришло письмо)
									</span>
								</div>

								<span v-if="verifyCodeError" :class="$style.errorMsg">
									{{ verifyCodeError }}
								</span>

								<div :class="$style.codeActions">
									<button
										type="button"
										:class="$style.confirmCodeBtn"
										:disabled="codeVerifying"
										@click="onVerifyCode"
									>
										<Icon
											:name="codeVerifying ? 'mdi:loading' : 'mdi:check'"
											:class="[$style.sendCodeIcon, codeVerifying && $style.spinning]"
										/>
										{{ codeVerifying ? "Проверка..." : "Подтвердить код" }}
									</button>

									<button
										type="button"
										:class="[
											$style.resendBtn,
											(resendCooldown > 0 || codeSending) && $style.resendBtnDisabled,
										]"
										:disabled="resendCooldown > 0 || codeSending"
										@click="onSendCode"
									>
										{{
											resendCooldown > 0
												? `Повторно через ${resendCooldown}с`
												: "Отправить снова"
										}}
									</button>
								</div>
							</div>
						</template>

						<!-- Бейдж успешной верификации -->
						<div v-if="emailVerified" :class="$style.verifiedBadge">
							<Icon name="mdi:check-circle-outline" :class="$style.verifiedIcon" />
							<span>Почта подтверждена</span>
							<button
								type="button"
								:class="$style.changeEmailBtn"
								@click="resetEmailVerification"
							>
								Изменить
							</button>
						</div>
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

					<label :class="$style.consent">
						<input
							v-model="isResident"
							type="checkbox"
							:class="$style.consentCheckbox"
						/>
						<span :class="$style.consentText">
							Я являюсь проживающим в общежитии
						</span>
					</label>

					<template v-if="isResident">
						<span :class="$style.residentHint">
							<Icon name="mdi:information-outline" :class="$style.residentHintIcon" />
							После регистрации администратор получит заявку на вашу верификацию как проживающего.
						</span>

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

						<div :class="$style.fieldGroup">
							<UiInput
								v-model="form.vk"
								placeholder="Ссылка или тег ВКонтакте"
								left-icon-name="mdi:vk"
								:status="errors.vk ? 'error' : undefined"
								@blur="
									errors.vk =
										isResident &&
										!vkContactRegex.test(form.vk.trim())
								"
							/>
							<span
								:class="[$style.hint, errors.vk && $style.hintError]"
							>
								Например: <strong>@durov</strong> или
								<strong>https://vk.com/durov</strong>. Это основной
								способ связи коменданта с вами.
							</span>
						</div>
					</template>
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
						<RouterLink to="/agreements/privacy" :class="$style.consentLink">
							согласие на обработку моих персональных данных
						</RouterLink>
					</span>
				</label>

				<div :class="$style.submitWrap">
					<UiButton
						accent
						type="submit"
						:disabled="loading || !emailVerified"
						:class="$style.submitBtn"
						@click="onSubmit"
					>
						{{ loading ? "Регистрация..." : "Зарегистрироваться" }}
					</UiButton>
					<span v-if="!emailVerified" :class="$style.submitHint">
						Сначала подтвердите студенческую почту выше
					</span>
				</div>

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

		// ── Кнопка отправки кода ─────────────────────────────────

		.sendCodeBtn {
			@include text-s;

			display: inline-flex;
			align-items: center;
			column-gap: 6px;
			align-self: flex-start;
			padding: 7px 14px;
			border-radius: 8px;
			border: 1px solid rgba($color-accent-rgb, 0.4);
			background: rgba($color-accent-rgb, 0.08);
			color: $color-accent;
			cursor: pointer;
			font-weight: 600;
			transition: background 0.15s;

			&:hover:not(:disabled) {
				background: rgba($color-accent-rgb, 0.15);
			}

			.sendCodeIcon {
				width: 15px;
				height: 15px;
			}
		}

		.sendCodeBtnDisabled {
			opacity: 0.45;
			cursor: not-allowed;
		}

		// ── Блок ввода кода ──────────────────────────────────────

		.codeSection {
			display: flex;
			flex-direction: column;
			row-gap: 8px;
			padding: 14px;
			border-radius: 10px;
			border: 1px solid rgba($color-accent-rgb, 0.2);
			background: rgba($color-accent-rgb, 0.04);
		}

		.codeHint {
			@include text-s;
			@include color-black;

			display: flex;
			align-items: center;
			column-gap: 6px;
			opacity: 0.7;

			.codeHintIcon {
				width: 15px;
				height: 15px;
				flex-shrink: 0;
				color: $color-accent;
				opacity: 1;
			}
		}

		.mailLinkRow {
			display: flex;
			align-items: center;
			column-gap: 4px;

			.mailLinkIcon {
				width: 13px;
				height: 13px;
				opacity: 0.5;
			}
		}

		.mailLink {
			@include text-s;
			@include color-accent;

			font-weight: 600;
			text-decoration: underline;
		}

		.mailLinkHint {
			@include text-s;
			@include color-black;

			opacity: 0.45;
		}

		.codeActions {
			display: flex;
			align-items: center;
			column-gap: 8px;
			flex-wrap: wrap;
			row-gap: 6px;
		}

		.confirmCodeBtn {
			@include text-s;

			display: inline-flex;
			align-items: center;
			column-gap: 6px;
			padding: 7px 14px;
			border-radius: 8px;
			border: none;
			background: $color-accent;
			color: #fff;
			cursor: pointer;
			font-weight: 600;
			transition: opacity 0.15s;

			&:disabled {
				opacity: 0.55;
				cursor: not-allowed;
			}
		}

		.resendBtn {
			@include text-s;
			@include color-black;

			background: transparent;
			border: none;
			cursor: pointer;
			opacity: 0.55;
			text-decoration: underline;
			padding: 0;
		}

		.resendBtnDisabled {
			cursor: not-allowed;
			text-decoration: none;
		}

		// ── Бейдж верификации ────────────────────────────────────

		.verifiedBadge {
			@include text-s;

			display: inline-flex;
			align-items: center;
			column-gap: 6px;
			padding: 7px 12px;
			border-radius: 8px;
			background: #efffde;
			color: #1c5b1c;
			border: 1px solid rgba(28, 91, 28, 0.2);
			align-self: flex-start;

			.verifiedIcon {
				width: 16px;
				height: 16px;
				flex-shrink: 0;
			}
		}

		.changeEmailBtn {
			@include text-s;

			background: transparent;
			border: none;
			cursor: pointer;
			color: inherit;
			opacity: 0.6;
			text-decoration: underline;
			padding: 0;
			margin-left: 4px;
		}

		// ── Подсказка для проживающих ────────────────────────────

		.residentHint {
			@include text-s;
			@include color-black;

			display: flex;
			align-items: flex-start;
			column-gap: 6px;
			opacity: 0.6;
			line-height: 1.5;

			.residentHintIcon {
				width: 14px;
				height: 14px;
				flex-shrink: 0;
				margin-top: 2px;
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

		.submitWrap {
			display: flex;
			flex-direction: column;
			row-gap: 6px;
		}

		.submitBtn {
			width: 100%;
			box-sizing: border-box;
		}

		.submitHint {
			@include text-s;
			@include color-black;

			text-align: center;
			opacity: 0.45;
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

		// ── Анимация ─────────────────────────────────────────────

		.spinning {
			animation: spin 0.8s linear infinite;

			@keyframes spin {
				to {
					transform: rotate(360deg);
				}
			}
		}
	}
}
</style>
