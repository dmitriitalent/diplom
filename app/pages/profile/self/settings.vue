<script setup lang="ts">
useSeoMeta({
	title: "Настройки",
	robots: "noindex, nofollow",
});

import { useDevice } from "~/composables/device";
import type { HeiDTO } from "~/dto/hei.dto";
import type { Dormitory } from "~/entities/Dormitory";
import type { Self } from "~/entities/Self";
import { useAuthStore } from "~/stores/authStore";
import { useSelfStore } from "~/stores/selfStore";
import type { DormitoryDtoGetList } from "~~/server/dto/dormitory/getList";
import type { SelfDataVisibility } from "~~/server/dto/selfDataVisibility.dto";
import { isVkContact } from "~/utils/contactUrl";

const router = useRouter();
const { logout } = useAuthStore();
const { self, updateSelf } = useSelfStore();
const { deviceClassList } = useDevice();
const { enabled: shaderEnabled } = useShader();
const { isDark, setTheme } = useTheme();
const darkTheme = computed({
	get: () => isDark.value,
	set: (v: boolean) => setTheme(v ? "dark" : "light"),
});

const saving = ref(false);
const saveStatus = ref<"success" | "error" | null>(null);
const saveError = ref("");
let notifyTimer: ReturnType<typeof setTimeout> | null = null;

const visibilityOptions = [
	{ value: "EVERYONE", name: "Все" },
	{ value: "FRIEND", name: "Друзья" },
	{ value: "ADMIN", name: "Админ" },
];

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
	// Как вас зовут
	surname: self?.surname.value ?? "",
	surnameVisibility: (self?.surname.visibility ??
		"EVERYONE") as SelfDataVisibility,
	name: self?.name.value ?? "",
	nameVisibility: (self?.name.visibility ?? "EVERYONE") as SelfDataVisibility,
	patronymic: self?.patronymic.value ?? "",
	patronymicVisibility: (self?.patronymic.visibility ??
		"EVERYONE") as SelfDataVisibility,

	// Учётная запись (readonly)
	login: self?.login ?? "",
	educationEmail: self?.educationEmail ?? "",

	// Учёба
	hei: undefined as string | undefined,
	birthdate: self?.birthdate.value as Date | undefined,
	birthdateVisibility: (self?.birthdate.visibility ??
		"EVERYONE") as SelfDataVisibility,

	// Где живёте
	dormitory: self?.dormitory.id as string | undefined,
	building: self?.building.value ?? "",
	buildingVisibility: (self?.building.visibility ??
		"EVERYONE") as SelfDataVisibility,
	floor: self?.floor.value ?? "",
	floorVisibility: (self?.floor.visibility ??
		"EVERYONE") as SelfDataVisibility,
	room: self?.room.value ?? "",
	roomVisibility: (self?.room.visibility ?? "EVERYONE") as SelfDataVisibility,
});

// ─── Contacts ─────────────────────────────────────────────────────────────────

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

/**
 * `true`, если у пользователя НЕ заполнен ни один VK-контакт.
 * Используется для отображения неубираемой плашки в секции контактов:
 * VK — основной канал связи комендатуры с проживающим.
 */
const hasNoVkContact = computed(() =>
	!localContacts.value.some((c) => isVkContact(c.key) && c.value.trim()),
);

const addVkContactQuick = () => {
	localContacts.value.push({
		key: "vk",
		value: "",
		visibility: "EVERYONE",
		isPrimary: localContacts.value.length === 0,
	});
};

// ─── Save / Reset ─────────────────────────────────────────────────────────────

const onClickSave = async () => {
	if (self === null || self === undefined) return;
	if (saving.value) return;

	saving.value = true;
	saveStatus.value = null;
	if (notifyTimer) clearTimeout(notifyTimer);

	const newSelf: Self = {
		id: self.id,
		login: self.login,
		educationEmail: self.educationEmail,
		birthdate: {
			value: form.birthdate as Date,
			visibility: form.birthdateVisibility,
		},
		building: { value: form.building, visibility: form.buildingVisibility },
		floor: { value: form.floor, visibility: form.floorVisibility },
		room: { value: form.room, visibility: form.roomVisibility },
		surname: { value: form.surname, visibility: form.surnameVisibility },
		name: { value: form.name, visibility: form.nameVisibility },
		patronymic: {
			value: form.patronymic,
			visibility: form.patronymicVisibility,
		},
		dormitory: {} as Dormitory,
		friends: [],
		contacts: localContacts.value,
	};

	try {
		await updateSelf(newSelf);
		saveStatus.value = "success";
		window.scrollTo({ top: 0, behavior: "smooth" });
		notifyTimer = setTimeout(() => {
			saveStatus.value = null;
		}, 4000);
	} catch (err: any) {
		saveStatus.value = "error";
		saveError.value =
			err?.data?.message ??
			err?.message ??
			"Произошла ошибка при сохранении";
		window.scrollTo({ top: 0, behavior: "smooth" });
	} finally {
		saving.value = false;
	}
};

const onClickReset = () => {
	form.surname = self?.surname.value ?? "";
	form.surnameVisibility = (self?.surname.visibility ??
		"EVERYONE") as SelfDataVisibility;
	form.name = self?.name.value ?? "";
	form.nameVisibility = (self?.name.visibility ??
		"EVERYONE") as SelfDataVisibility;
	form.patronymic = self?.patronymic.value ?? "";
	form.patronymicVisibility = (self?.patronymic.visibility ??
		"EVERYONE") as SelfDataVisibility;
	form.birthdate = self?.birthdate.value as Date | undefined;
	form.birthdateVisibility = (self?.birthdate.visibility ??
		"EVERYONE") as SelfDataVisibility;
	form.dormitory = self?.dormitory.id as string | undefined;
	form.building = self?.building.value ?? "";
	form.buildingVisibility = (self?.building.visibility ??
		"EVERYONE") as SelfDataVisibility;
	form.floor = self?.floor.value ?? "";
	form.floorVisibility = (self?.floor.visibility ??
		"EVERYONE") as SelfDataVisibility;
	form.room = self?.room.value ?? "";
	form.roomVisibility = (self?.room.visibility ??
		"EVERYONE") as SelfDataVisibility;
	localContacts.value = (self?.contacts ?? []).map((c) => ({
		key: c.key ?? "",
		value: c.value ?? "",
		visibility: (c.visibility ?? "EVERYONE") as SelfDataVisibility,
		isPrimary: c.isPrimary ?? false,
	}));
};

const onClickLogout = () => {
	logout().then(() => {
		router.push("/");
	});
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<UiAppear>
			<div :class="$style.card">
				<h1 :class="$style.title">Настройки</h1>

				<!-- Уведомление -->
				<UiTransition name="fade-top">
					<div
						v-if="saveStatus !== null"
						:class="
							saveStatus === 'success'
								? $style.notifySuccess
								: $style.notifyError
						"
					>
						<Icon
							:name="
								saveStatus === 'success'
									? 'mdi:check-circle-outline'
									: 'mdi:alert-circle-outline'
							"
							:class="$style.notifyIcon"
						/>
						<span v-if="saveStatus === 'success'"
							>Изменения успешно сохранены</span
						>
						<span v-else>{{ saveError }}</span>
					</div>
				</UiTransition>

				<!-- ── Как вас зовут ───────────────────────────────────── -->
				<div :class="$style.section">
					<div :class="$style.sectionTitle">Как вас зовут</div>

					<div :class="$style.row">
						<div :class="$style.fieldWithVis">
							<UiInput
								v-model="form.surname"
								placeholder="Фамилия"
								left-icon-name="material-symbols:drive-file-rename-outline-outline-rounded"
							/>
							<UiSelect
								v-model="form.surnameVisibility"
								:options="visibilityOptions"
								:class="$style.visSelect"
							/>
						</div>
						<div :class="$style.fieldWithVis">
							<UiInput
								v-model="form.name"
								placeholder="Имя"
								left-icon-name="material-symbols:drive-file-rename-outline-outline-rounded"
							/>
							<UiSelect
								v-model="form.nameVisibility"
								:options="visibilityOptions"
								:class="$style.visSelect"
							/>
						</div>
					</div>

					<div :class="$style.fieldWithVis">
						<UiInput
							v-model="form.patronymic"
							placeholder="Отчество"
							left-icon-name="material-symbols:drive-file-rename-outline-outline-rounded"
						/>
						<UiSelect
							v-model="form.patronymicVisibility"
							:options="visibilityOptions"
							:class="$style.visSelect"
						/>
					</div>
				</div>

				<!-- ── Учётная запись ──────────────────────────────────── -->
				<div :class="$style.section">
					<div :class="$style.sectionTitle">Учётная запись</div>

					<UiInput
						v-model="form.login"
						placeholder="Логин"
						left-icon-name="material-symbols:account-circle-full"
						disabled
					/>
					<UiInput
						v-model="form.educationEmail"
						placeholder="Студенческая почта"
						left-icon-name="material-symbols:mail-outline"
						disabled
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
						<div :class="$style.fieldWithVis">
							<UiDatePicker
								v-model="form.birthdate"
								placeholder="Дата рождения"
								left-icon-name="cil:birthday-cake"
								:enable-time="false"
							/>
							<UiSelect
								v-model="form.birthdateVisibility"
								:options="visibilityOptions"
								:class="$style.visSelect"
							/>
						</div>
					</div>
				</div>

				<!-- ── Где живёте ──────────────────────────────────────── -->
				<div :class="$style.section">
					<div :class="$style.sectionTitle">Где живёте</div>

					<UiSelect
						v-model="form.dormitory"
						:options="dormitoryOptions"
						placeholder="Общежитие"
						left-icon-name="material-symbols:home-work-outline-rounded"
					/>

					<div :class="$style.row">
						<div :class="$style.fieldWithVis">
							<UiInput
								v-model="form.building"
								placeholder="Корпус"
								left-icon-name="material-symbols:home-work-outline-rounded"
							/>
							<UiSelect
								v-model="form.buildingVisibility"
								:options="visibilityOptions"
								:class="$style.visSelect"
							/>
						</div>
						<div :class="$style.fieldWithVis">
							<UiInput
								v-model="form.floor"
								placeholder="Этаж"
								left-icon-name="material-symbols:home-work-outline-rounded"
							/>
							<UiSelect
								v-model="form.floorVisibility"
								:options="visibilityOptions"
								:class="$style.visSelect"
							/>
						</div>
					</div>

					<div :class="$style.fieldWithVis">
						<UiInput
							v-model="form.room"
							placeholder="Комната"
							left-icon-name="material-symbols:home-work-outline-rounded"
						/>
						<UiSelect
							v-model="form.roomVisibility"
							:options="visibilityOptions"
							:class="$style.visSelect"
						/>
					</div>
				</div>

				<!-- ── Контакты ────────────────────────────────────────── -->
				<div :class="$style.section">
					<div :class="$style.sectionTitle">Контакты</div>

					<!-- Неубираемая плашка: VK — основной канал коменданта -->
					<div v-if="hasNoVkContact" :class="$style.vkWarning">
						<Icon
							name="mdi:vk"
							:class="$style.vkWarningIcon"
						/>
						<div :class="$style.vkWarningBody">
							<div :class="$style.vkWarningTitle">
								Не указан контакт ВКонтакте
							</div>
							<div :class="$style.vkWarningText">
								ВКонтакте — основной канал связи коменданта
								с&nbsp;проживающими. Без него комендант не
								сможет написать вам в&nbsp;личные сообщения.
							</div>
							<button
								type="button"
								:class="$style.vkWarningBtn"
								@click="addVkContactQuick"
							>
								<Icon
									name="mdi:plus"
									:class="$style.vkWarningBtnIcon"
								/>
								Добавить VK
							</button>
						</div>
					</div>

					<div
						v-for="(contact, i) in localContacts"
						:key="i"
						:class="$style.contactRow"
					>
						<label
							:class="$style.radioLabel"
							:title="
								contact.isPrimary
									? 'Предпочитаемый контакт'
									: 'Сделать предпочитаемым'
							"
						>
							<input
								type="radio"
								name="primaryContact"
								:checked="contact.isPrimary"
								:class="$style.radio"
								@change="setPrimary(i)"
							/>
							<span
								:class="[
									$style.radioCustom,
									contact.isPrimary &&
										$style.radioCustomActive,
								]"
							>
								<Icon
									v-if="contact.isPrimary"
									name="mdi:star"
									:class="$style.starIcon"
								/>
								<Icon
									v-else
									name="mdi:star-outline"
									:class="$style.starIcon"
								/>
							</span>
						</label>

						<UiInput
							v-model="localContacts[i].key"
							placeholder="Тип (telegram, phone...)"
							:class="$style.contactKey"
						/>
						<UiInput
							v-model="localContacts[i].value"
							placeholder="Значение"
							:class="$style.contactValue"
						/>
						<UiSelect
							v-model="localContacts[i].visibility"
							:options="visibilityOptions"
							:class="$style.contactVisibility"
						/>
						<UiButton
							:class="$style.contactDelete"
							@click="deleteContact(i)"
						>
							<Icon
								name="material-symbols:delete-outline"
								:class="$style.deleteIcon"
							/>
						</UiButton>
					</div>

					<UiButton
						:class="$style.addContactBtn"
						inset
						@click="addContact"
					>
						<Icon
							name="material-symbols:add"
							:class="$style.addIcon"
						/>
						Добавить контакт
					</UiButton>
				</div>

				<!-- ── Внешний вид ─────────────────────────────────────── -->
				<div :class="$style.section">
					<div :class="$style.sectionTitle">Внешний вид</div>

					<UiCheckbox v-model="darkTheme" name="Тёмная тема" />
					<UiCheckbox
						v-model="shaderEnabled"
						name="Фоновый шейдер"
					/>
				</div>

				<!-- ── Верификация ─────────────────────────────────────── -->
				<div id="verification" :class="$style.section">
					<ProfileVerificationSection />
				</div>

				<!-- ── Кнопки ──────────────────────────────────────────── -->
				<div :class="$style.actions">
					<UiButton :class="$style.resetBtn" @click="onClickReset">
						Сбросить
					</UiButton>
					<UiButton
						accent
						:class="$style.saveBtn"
						:disabled="saving"
						@click="onClickSave"
					>
						{{ saving ? "Сохранение..." : "Сохранить" }}
					</UiButton>
				</div>

				<UiButton :class="$style.logout" @click="onClickLogout">
					Выйти
				</UiButton>
			</div>
		</UiAppear>
	</div>
</template>

<style module lang="scss">
.wrapper {
	display: flex;
	align-items: flex-start;
	justify-content: center;
	min-height: 100vh;
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

		.notifySuccess,
		.notifyError {
			@include text-m;
			@include color-black;

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

		.notifySuccess {
			@include color-success-bg;
		}

		.notifyError {
			@include color-error-bg;
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

		// ── Сетки ────────────────────────────────────────────────

		.row {
			display: grid;
			grid-template-columns: 1fr 1fr;
			column-gap: 10px;

			@include respond-to(mobile) {
				grid-template-columns: 1fr;
				row-gap: 10px;
			}
		}

		.fieldWithVis {
			display: flex;
			flex-direction: column;
			row-gap: 6px;

			.visSelect {
				width: 100%;
			}
		}

		// ── Контакты ─────────────────────────────────────────────

		.contactRow {
			display: flex;
			align-items: center;
			column-gap: 8px;

			@include respond-to(mobile) {
				flex-wrap: wrap;
				row-gap: 6px;
				padding-bottom: 10px;
				border-bottom: 1px solid rgba($color-black-rgb, 0.06);
			}
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
			width: 170px;
			flex-shrink: 0;

			@include respond-to(mobile) {
				order: 2;
				flex: 1;
				width: auto;
				min-width: 0;
			}
		}

		.contactValue {
			flex: 1;

			@include respond-to(mobile) {
				order: 4;
				flex: 1;
				min-width: 0;
			}
		}

		.contactVisibility {
			width: 140px;
			flex-shrink: 0;

			@include respond-to(mobile) {
				order: 5;
				width: 120px;
			}
		}

		.contactDelete {
			@include color-error-bg;

			flex-shrink: 0;
			padding: 6px;

			.deleteIcon {
				width: 18px;
				height: 18px;
			}

			@include respond-to(mobile) {
				order: 3;
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

		// ── Плашка: VK не указан (неубираемая) ──────────────────

		.vkWarning {
			@include color-black;

			display: flex;
			align-items: flex-start;
			column-gap: 12px;
			padding: 14px 16px;
			border-radius: 10px;
			border: 1px solid rgba($color-error-rgb, 0.35);
			background: rgba($color-error-rgb, 0.08);

			.vkWarningIcon {
				width: 28px;
				height: 28px;
				flex-shrink: 0;
				color: #0077ff;
				margin-top: 2px;
			}

			.vkWarningBody {
				display: flex;
				flex-direction: column;
				row-gap: 6px;
				min-width: 0;
			}

			.vkWarningTitle {
				@include text-m;
				@include color-black;

				font-weight: 600;
			}

			.vkWarningText {
				@include text-s;
				@include color-black(0.75);

				line-height: 1.45;
			}

			.vkWarningBtn {
				@include text-s;

				display: inline-flex;
				align-items: center;
				column-gap: 6px;
				align-self: flex-start;
				margin-top: 4px;
				padding: 7px 14px;
				border-radius: 8px;
				border: 1px solid rgba($color-accent-rgb, 0.4);
				background: rgba($color-accent-rgb, 0.1);
				color: $color-accent;
				cursor: pointer;
				font-weight: 600;
				transition: background 0.15s;

				&:hover {
					background: rgba($color-accent-rgb, 0.2);
				}

				.vkWarningBtnIcon {
					width: 14px;
					height: 14px;
				}
			}
		}

		// ── Кнопки действий ──────────────────────────────────────

		.actions {
			display: flex;
			justify-content: flex-end;
			column-gap: 10px;

			@include respond-to(mobile) {
				flex-direction: column;
				row-gap: 10px;
			}

			.resetBtn {
				box-sizing: border-box;

				@include respond-to(mobile) {
					width: 100%;
				}
			}

			.saveBtn {
				box-sizing: border-box;
				min-width: 150px;

				@include respond-to(mobile) {
					width: 100%;
				}
			}
		}

		.logout {
			@include color-error-bg;

			box-sizing: border-box;
			width: 140px;
			margin: 0 auto;

			@include respond-to(mobile) {
				width: 100%;
			}
		}
	}
}
</style>
