<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useVerifications } from "~/composables/useVerifications";
import { useSelfStore } from "~/stores/selfStore";

const { myVerification, loading, error, fetchMine, submit } = useVerifications();
const { self } = storeToRefs(useSelfStore());

await fetchMine();

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
	() => !isPending.value && !isApproved.value && !submitting.value,
);

const statusInfo = computed(() => {
	const s = myVerification.value?.status;
	if (!s) return null;
	const map: Record<
		string,
		{ label: string; icon: string; tone: "ok" | "warn" | "bad" }
	> = {
		PENDING:  { label: "На проверке",  icon: "mdi:clock-outline",         tone: "warn" },
		APPROVED: { label: "Подтверждено", icon: "mdi:check-decagram-outline", tone: "ok"   },
		REJECTED: { label: "Отклонено",    icon: "mdi:close-circle-outline",  tone: "bad"  },
		DECLINED: { label: "Отклонено",    icon: "mdi:close-circle-outline",  tone: "bad"  },
	};
	return (
		map[s] ?? { label: s, icon: "mdi:information-outline", tone: "warn" as const }
	);
});

const formatDate = (s?: string) => {
	if (!s) return "";
	return new Date(s).toLocaleString("ru-RU", {
		day: "2-digit",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const onSubmit = async () => {
	submitting.value = true;
	localError.value = null;
	try {
		// Backend требует непустой documentId. Так как мы убрали загрузку
		// документа, отправляем студенческую почту пользователя — этот
		// способ уже поддерживается админ-панелью (AdminVerifications.vue
		// помечает такие заявки как «Верификация по студенческой почте»).
		// Если по какой-то причине почта недоступна — fallback на UUID-заглушку.
		const documentId =
			self.value?.educationEmail?.trim() || crypto.randomUUID();
		await submit(documentId);
	} catch (e: any) {
		localError.value =
			e?.data?.message ?? e?.message ?? "Не удалось отправить заявку";
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
				<div
					v-if="isRejected && myVerification?.comment"
					:class="$style.statusComment"
				>
					{{ myVerification.comment }}
				</div>
			</div>
		</div>

		<!-- Описание -->
		<p v-if="!isApproved" :class="$style.hint">
			Подтвердите комендатуре, что действительно проживаете в&nbsp;этом
			общежитии. Заявка будет отправлена с&nbsp;вашей студенческой
			почтой&nbsp;— комендант проверит её и&nbsp;одобрит или отклонит.
		</p>

		<!-- Кнопка отправки: только если нет PENDING и не APPROVED -->
		<div v-if="!isPending && !isApproved" :class="$style.form">
			<div v-if="localError || error" :class="$style.error">
				<Icon name="mdi:alert-circle-outline" :class="$style.errorIcon" />
				{{ localError ?? error }}
			</div>

			<UiButton accent :disabled="!canSubmit" @click="onSubmit">
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
