<script setup lang="ts">
import { useVerifications } from "~/composables/useVerifications";

const { myVerification, loading, error, fetchMine, submit } = useVerifications();

await fetchMine();

const file = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const submitting = ref(false);
const localError = ref<string | null>(null);

const isPending = computed(() => myVerification.value?.status === "PENDING");
const isApproved = computed(() => myVerification.value?.status === "APPROVED");
const isRejected = computed(
	() =>
		myVerification.value?.status === "REJECTED" ||
		myVerification.value?.status === "DECLINED",
);
const canSubmit = computed(
	() => !isPending.value && !isApproved.value && !!file.value && !submitting.value,
);

const statusInfo = computed(() => {
	const s = myVerification.value?.status;
	if (!s) return null;
	const map: Record<string, { label: string; icon: string; tone: "ok" | "warn" | "bad" }> = {
		PENDING:  { label: "На проверке",  icon: "mdi:clock-outline",         tone: "warn" },
		APPROVED: { label: "Подтверждено", icon: "mdi:check-decagram-outline", tone: "ok"   },
		REJECTED: { label: "Отклонено",    icon: "mdi:close-circle-outline",  tone: "bad"  },
		DECLINED: { label: "Отклонено",    icon: "mdi:close-circle-outline",  tone: "bad"  },
	};
	return map[s] ?? { label: s, icon: "mdi:information-outline", tone: "warn" as const };
});

const formatDate = (s?: string) => {
	if (!s) return "";
	return new Date(s).toLocaleString("ru-RU", {
		day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
	});
};

const openFile = () => fileInput.value?.click();

const onFileChange = (e: Event) => {
	const input = e.target as HTMLInputElement;
	const f = input.files?.[0] ?? null;
	if (!f) return;
	if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
	file.value = f;
	previewUrl.value = URL.createObjectURL(f);
	input.value = "";
};

const clearFile = () => {
	if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
	file.value = null;
	previewUrl.value = null;
};

const onSubmit = async () => {
	if (!file.value) return;
	submitting.value = true;
	localError.value = null;
	try {
		// 1) Загружаем документ как картинку, получаем GUID
		const guid = crypto.randomUUID();
		const formData = new FormData();
		formData.append("file", file.value);
		formData.append("external_id", guid);
		await $fetch("/api/images/upload", { method: "POST", body: formData });

		// 2) Отправляем заявку с documentId = guid
		const v = await submit(guid);
		if (v) clearFile();
	} catch (e: any) {
		localError.value =
			e?.data?.message ?? e?.message ?? "Не удалось загрузить документ";
	} finally {
		submitting.value = false;
	}
};
</script>

<template>
	<div :class="$style.wrap">
		<div :class="$style.sectionTitle">Верификация резидента</div>

		<div v-if="loading && !myVerification" :class="$style.muted">Загрузка…</div>

		<!-- Текущий статус -->
		<div
			v-if="statusInfo"
			:class="[$style.status, $style[`tone_${statusInfo.tone}`]]"
		>
			<Icon :name="statusInfo.icon" :class="$style.statusIcon" />
			<div :class="$style.statusBody">
				<div :class="$style.statusLabel">{{ statusInfo.label }}</div>
				<div v-if="myVerification?.createdAt" :class="$style.statusMeta">
					отправлено {{ formatDate(myVerification.createdAt) }}
				</div>
				<div v-if="isRejected && myVerification?.comment" :class="$style.statusComment">
					{{ myVerification.comment }}
				</div>
			</div>
		</div>

		<!-- Описание -->
		<p v-if="!isApproved" :class="$style.hint">
			Подтвердите комендатуре, что действительно проживаете в этом общежитии.
		</p>

		<!-- Форма загрузки: только если нет PENDING и не APPROVED -->
		<div v-if="!isPending && !isApproved" :class="$style.form">
			<div v-if="previewUrl" :class="$style.previewBox">
				<img :src="previewUrl" :class="$style.previewImg" alt="document" />
				<button :class="$style.clearBtn" @click="clearFile">
					<Icon name="mdi:close" :class="$style.clearIcon" />
				</button>
			</div>
			<div v-else :class="$style.dropzone" @click="openFile">
				<Icon name="mdi:file-document-plus-outline" :class="$style.dropIcon" />
				<span :class="$style.dropText">Прикрепить документ</span>
				<span :class="$style.dropHint">JPG, PNG · до 10 МБ</span>
			</div>

			<input
				ref="fileInput"
				type="file"
				accept="image/*"
				hidden
				@change="onFileChange"
			/>

			<div v-if="localError || error" :class="$style.error">
				<Icon name="mdi:alert-circle-outline" :class="$style.errorIcon" />
				{{ localError ?? error }}
			</div>

			<UiButton
				accent
				:disabled="!canSubmit"
				@click="onSubmit"
			>
				{{ submitting ? "Отправка…" : "Отправить заявку" }}
			</UiButton>
		</div>
	</div>
</template>

<style module lang="scss">
.wrap {
	display: flex;
	flex-direction: column;
	row-gap: 12px;
}

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

.muted {
	@include text-s;
	@include color-black(0.55);
}

.hint {
	@include reset;
	@include text-s;
	@include color-black(0.6);

	line-height: 1.5;
}

.status {
	display: flex;
	align-items: flex-start;
	column-gap: 12px;
	padding: 14px 16px;
	border-radius: 10px;
}

.statusIcon {
	width: 22px;
	height: 22px;
	flex-shrink: 0;
	margin-top: 2px;
}

.statusLabel {
	@include text-m;

	font-weight: 600;
}

.statusMeta {
	@include text-s;

	opacity: 0.7;
}

.statusComment {
	@include text-s;

	margin-top: 6px;
	font-style: italic;
}

.tone_ok {
	background: #efffde;
	color: #1c5b1c;
}

.tone_warn {
	background: #fff3c8;
	color: #7a5a00;
}

.tone_bad {
	background: #ffcdcd;
	color: #7a1c1c;
}

.form {
	display: flex;
	flex-direction: column;
	row-gap: 12px;
}

.dropzone {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	row-gap: 6px;
	padding: 28px 20px;
	border-radius: 10px;
	border: 2px dashed rgba($color-black-rgb, 0.18);
	cursor: pointer;
	transition: background 0.15s, border-color 0.15s;

	&:hover {
		border-color: rgba($color-black-rgb, 0.35);

		@include color-black-bg(0.04);
	}
}

.dropIcon {
	@include color-black(0.55);

	width: 36px;
	height: 36px;
}

.dropText {
	@include text-m;
	@include color-black;

	font-weight: 600;
}

.dropHint {
	@include text-xs;
	@include color-black(0.5);
}

.previewBox {
	position: relative;
	width: 100%;
	max-height: 320px;
	border-radius: 10px;
	overflow: hidden;

	@include color-black-bg(0.08);
}

.previewImg {
	width: 100%;
	height: 100%;
	max-height: 320px;
	object-fit: contain;
	display: block;
}

.clearBtn {
	position: absolute;
	top: 8px;
	right: 8px;
	width: 28px;
	height: 28px;
	border: 0;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.55);
	color: #fff;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
}

.clearIcon {
	width: 16px;
	height: 16px;
}

.error {
	display: flex;
	align-items: center;
	column-gap: 8px;
	padding: 10px 14px;
	border-radius: 8px;
	background: #ffcdcd;
	color: #7a1c1c;

	@include text-s;
}

.errorIcon {
	width: 16px;
	height: 16px;
	flex-shrink: 0;
}
</style>
