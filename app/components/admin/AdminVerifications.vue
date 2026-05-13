<script setup lang="ts">
import {
	useVerifications,
	type Verification,
} from "~/composables/useVerifications";
import { useDevice } from "~/composables/device";

const { deviceClassList } = useDevice();

const { pending, loading, error, fetchPending, review } = useVerifications();

await fetchPending();

const commentDraft = ref<Record<string, string>>({});
const busy = ref<Record<string, "approve" | "reject" | null>>({});

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

const onApprove = async (v: Verification) => {
	busy.value[v.id] = "approve";
	await review(v.id, true, commentDraft.value[v.id]?.trim() || undefined);
	busy.value[v.id] = null;
};

const onReject = async (v: Verification) => {
	const comment = commentDraft.value[v.id]?.trim();
	if (!comment) {
		alert("Для отклонения нужно указать причину в комментарии.");
		return;
	}
	busy.value[v.id] = "reject";
	await review(v.id, false, comment);
	busy.value[v.id] = null;
};
</script>

<template>
	<div :class="[$style.wrap, ...deviceClassList]">
		<div :class="$style.header">
			<h2 :class="$style.title">Заявки на верификацию</h2>
			<p :class="$style.hint">
				ADMIN видит все заявки, COMMANDANT — только из своего общежития.
			</p>
		</div>

		<div v-if="error" :class="$style.error">
			<Icon name="mdi:alert-circle-outline" :class="$style.errorIcon" />
			{{ error }}
		</div>

		<div v-if="loading && pending.length === 0" :class="$style.muted">
			Загрузка…
		</div>

		<div v-else-if="pending.length === 0" :class="$style.empty">
			<Icon name="mdi:check-decagram-outline" :class="$style.emptyIcon" />
			Нет заявок, ожидающих проверки
		</div>

		<div v-else :class="$style.list">
			<div v-for="v in pending" :key="v.id" :class="$style.item">
				<div :class="$style.itemHead">
					<div :class="$style.meta">
						<RouterLink
							:to="`/profile/${v.userId}`"
							:class="$style.userLink"
						>
							<Icon
								name="mdi:account-outline"
								:class="$style.userIcon"
							/>
							<code :class="$style.userId">{{ v.userId }}</code>
						</RouterLink>
						<span :class="$style.date">
							отправлено {{ formatDate(v.createdAt) }}
						</span>
					</div>
				</div>

				<div :class="$style.body">
					<a
						:href="`/api/images/byGuid?guid=${v.documentId}`"
						target="_blank"
						:class="$style.docLink"
					>
						<img
							:src="`/api/images/byGuid?guid=${v.documentId}`"
							:alt="`Документ ${v.id}`"
							:class="$style.docImg"
						/>
					</a>

					<div :class="$style.controls">
						<UiTextarea
							v-model="commentDraft[v.id]"
							:rows="3"
							placeholder="Комментарий (обязателен при отклонении)"
						/>
						<div :class="$style.actions">
							<button
								:class="[$style.btn, $style.btnApprove]"
								:disabled="!!busy[v.id]"
								@click="onApprove(v)"
							>
								<Icon
									:name="
										busy[v.id] === 'approve'
											? 'mdi:loading'
											: 'mdi:check-circle-outline'
									"
									:class="[
										$style.btnIcon,
										busy[v.id] === 'approve' &&
											$style.spinning,
									]"
								/>
								Одобрить
							</button>
							<button
								:class="[$style.btn, $style.btnReject]"
								:disabled="!!busy[v.id]"
								@click="onReject(v)"
							>
								<Icon
									:name="
										busy[v.id] === 'reject'
											? 'mdi:loading'
											: 'mdi:close-circle-outline'
									"
									:class="[
										$style.btnIcon,
										busy[v.id] === 'reject' &&
											$style.spinning,
									]"
								/>
								Отклонить
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style module lang="scss">
.wrap {
	display: flex;
	flex-direction: column;
	row-gap: 20px;

	@include respond-to(mobile) {
		row-gap: 14px;
	}

	.header {
		display: flex;
		flex-direction: column;
		row-gap: 6px;
	}

	.title {
		@include reset;
		@include title-s;
		@include color-black;
	}

	.hint {
		@include reset;
		@include text-s;
		@include color-black(0.55);

		line-height: 1.5;
	}

	.muted {
		@include text-s;
		@include color-black(0.55);
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

	.empty {
		display: flex;
		align-items: center;
		column-gap: 10px;
		padding: 20px;
		border-radius: 10px;

		@include color-black-bg(0.04);
		@include text-m;
		@include color-black(0.6);
	}

	.emptyIcon {
		width: 24px;
		height: 24px;
		color: #1c5b1c;
	}

	.list {
		display: flex;
		flex-direction: column;
		row-gap: 14px;
	}

	.item {
		display: flex;
		flex-direction: column;
		row-gap: 12px;
		padding: 16px;
		border-radius: 10px;

		@include color-black-bg(0.04);

		@include respond-to(mobile) {
			padding: 12px;
			row-gap: 10px;
		}
	}

	.itemHead {
		display: flex;
		justify-content: space-between;
		align-items: center;

		@include respond-to(mobile) {
			flex-direction: column;
			align-items: flex-start;
			row-gap: 6px;
		}
	}

	.meta {
		display: flex;
		flex-direction: column;
		row-gap: 4px;
	}

	.userLink {
		display: inline-flex;
		align-items: center;
		column-gap: 6px;
		text-decoration: none;

		@include color-black;
	}

	.userIcon {
		width: 18px;
		height: 18px;
	}

	.userId {
		@include text-s;

		font-family: monospace;
		font-weight: 600;
		word-break: break-all;
	}

	.date {
		@include text-xs;
		@include color-black(0.5);
	}

	.body {
		display: grid;
		grid-template-columns: 240px 1fr;
		gap: 14px;
		align-items: start;

		@include respond-to(mobile) {
			grid-template-columns: 1fr;
			gap: 10px;
		}
	}

	.docLink {
		display: block;
		width: 100%;
		aspect-ratio: 4/3;
		border-radius: 8px;
		overflow: hidden;

		@include color-black-bg(0.08);
	}

	.docImg {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.controls {
		display: flex;
		flex-direction: column;
		row-gap: 10px;
	}

	.actions {
		display: flex;
		column-gap: 8px;
		flex-wrap: wrap;

		@include respond-to(mobile) {
			flex-direction: column;
			column-gap: 0;
			row-gap: 8px;
		}
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		column-gap: 6px;
		padding: 8px 14px;
		border-radius: 8px;
		border: 1px solid transparent;
		cursor: pointer;

		@include text-s;

		font-weight: 600;

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		@include respond-to(mobile) {
			width: 100%;
			padding: 10px 14px;
		}
	}

	.btnApprove {
		background: #efffde;
		color: #1c5b1c;
		border-color: rgba(28, 91, 28, 0.2);

		&:hover:not(:disabled) {
			background: #def5c5;
		}
	}

	.btnReject {
		background: transparent;
		color: rgba(122, 28, 28, 1);
		border-color: rgba(122, 28, 28, 0.25);

		&:hover:not(:disabled) {
			background: rgba(122, 28, 28, 0.06);
		}
	}

	.btnIcon {
		width: 16px;
		height: 16px;
	}

	.spinning {
		animation: spin 0.8s linear infinite;

		@keyframes spin {
			to {
				transform: rotate(360deg);
			}
		}
	}
}
</style>
