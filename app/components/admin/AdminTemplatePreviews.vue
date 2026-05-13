<script setup lang="ts">
import {
	ACTIVITY_TEMPLATES,
	NEWS_TEMPLATES,
	PRODUCT_TEMPLATES,
	SERVICE_TEMPLATES,
	type TemplateDefinition,
} from "~/constants/templates";
import { useStaticfiles } from "~/composables/useStaticfiles";
import { useDevice } from "~/composables/device";

const { deviceClassList } = useDevice();

const groups: { title: string; templates: TemplateDefinition[] }[] = [
	{ title: "Мероприятия", templates: ACTIVITY_TEMPLATES },
	{ title: "Новости", templates: NEWS_TEMPLATES },
	{ title: "Каталог", templates: PRODUCT_TEMPLATES },
	{ title: "Услуги", templates: SERVICE_TEMPLATES },
];

const { list, loading, error, fetchList, upload, remove } = useStaticfiles();

await fetchList();

const uploadingKey = ref<string | null>(null);
const deletingKey = ref<string | null>(null);
const bumpVersion = ref(0); // чтобы обновить превью после загрузки/удаления

const hasFile = (key: string) => list.value.some((e) => e.key === key);
const previewUrl = (key: string) =>
	`/api/staticfiles/${key}?v=${bumpVersion.value}`;

const fileInputs = ref<Record<string, HTMLInputElement | null>>({});

const triggerUpload = (key: string) => {
	fileInputs.value[key]?.click();
};

const onFileChange = async (key: string, e: Event) => {
	const input = e.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	uploadingKey.value = key;
	const res = await upload(key, file);
	if (res) bumpVersion.value++;
	uploadingKey.value = null;
	input.value = "";
};

const onDelete = async (key: string) => {
	if (!confirm(`Удалить превью «${key}»?`)) return;
	deletingKey.value = key;
	const ok = await remove(key);
	if (ok) bumpVersion.value++;
	deletingKey.value = null;
};
</script>

<template>
	<div :class="[$style.wrap, ...deviceClassList]">
		<div :class="$style.header">
			<h2 :class="$style.title">Превью шаблонов</h2>
			<p :class="$style.hint">
				Изображения хранятся на BFF и отображаются в выборе шаблона при
				создании/редактировании материалов.
			</p>
		</div>

		<div v-if="error" :class="$style.error">
			<Icon name="mdi:alert-circle-outline" :class="$style.errorIcon" />
			{{ error }}
		</div>

		<div v-if="loading && list.length === 0" :class="$style.loadingNote">
			Загрузка…
		</div>

		<div v-for="group in groups" :key="group.title" :class="$style.group">
			<h3 :class="$style.groupTitle">{{ group.title }}</h3>

			<div :class="$style.grid">
				<div
					v-for="tpl in group.templates"
					:key="tpl.id"
					:class="$style.item"
				>
					<div :class="$style.preview">
						<img
							v-if="hasFile(tpl.key)"
							:src="previewUrl(tpl.key)"
							:alt="tpl.name"
							:class="$style.previewImg"
						/>
						<div v-else :class="$style.previewEmpty">
							<Icon
								name="mdi:image-off-outline"
								:class="$style.emptyIcon"
							/>
							<span :class="$style.emptyLabel">Не загружено</span>
						</div>
					</div>

					<div :class="$style.meta">
						<div :class="$style.metaTop">
							<span :class="$style.metaName">{{ tpl.name }}</span>
							<code :class="$style.metaKey">{{ tpl.key }}</code>
						</div>

						<div :class="$style.actions">
							<button
								:class="$style.btnUpload"
								:disabled="uploadingKey === tpl.key"
								@click="triggerUpload(tpl.key)"
							>
								<Icon
									:name="
										uploadingKey === tpl.key
											? 'mdi:loading'
											: 'mdi:upload'
									"
									:class="[
										$style.btnIcon,
										uploadingKey === tpl.key &&
											$style.spinning,
									]"
								/>
								{{
									hasFile(tpl.key) ? "Заменить" : "Загрузить"
								}}
							</button>

							<button
								v-if="hasFile(tpl.key)"
								:class="$style.btnDelete"
								:disabled="deletingKey === tpl.key"
								@click="onDelete(tpl.key)"
							>
								<Icon
									:name="
										deletingKey === tpl.key
											? 'mdi:loading'
											: 'mdi:trash-can-outline'
									"
									:class="[
										$style.btnIcon,
										deletingKey === tpl.key &&
											$style.spinning,
									]"
								/>
							</button>
						</div>

						<input
							type="file"
							accept="image/*"
							hidden
							:ref="
								(el) => {
									fileInputs[tpl.key] =
										el as HTMLInputElement | null;
								}
							"
							@change="(e) => onFileChange(tpl.key, e)"
						/>
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
	row-gap: 24px;

	@include respond-to(mobile) {
		row-gap: 16px;
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

	.loadingNote {
		@include text-s;
		@include color-black(0.55);
	}

	.group {
		display: flex;
		flex-direction: column;
		row-gap: 12px;
	}

	.groupTitle {
		@include reset;
		@include text-m;
		@include color-black;

		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 16px;

		@include respond-to(mobile) {
			grid-template-columns: 1fr;
			gap: 10px;
		}
	}

	.item {
		display: flex;
		flex-direction: column;
		row-gap: 10px;
		padding: 12px;
		border-radius: 10px;

		@include color-black-bg(0.04);

		@include respond-to(mobile) {
			flex-direction: row;
			align-items: center;
			column-gap: 12px;
			row-gap: 0;
			padding: 10px;
		}
	}

	.preview {
		width: 100%;
		aspect-ratio: 16/10;
		border-radius: 8px;
		overflow: hidden;

		@include color-black-bg(0.08);

		display: flex;
		align-items: center;
		justify-content: center;

		@include respond-to(mobile) {
			width: 96px;
			height: 64px;
			aspect-ratio: auto;
			flex-shrink: 0;
		}
	}

	.previewImg {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.previewEmpty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		row-gap: 6px;
	}

	.emptyIcon {
		@include color-black(0.25);

		width: 32px;
		height: 32px;
	}

	.emptyLabel {
		@include text-xs;
		@include color-black(0.45);

		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.meta {
		display: flex;
		flex-direction: column;
		row-gap: 8px;

		@include respond-to(mobile) {
			flex: 1;
			min-width: 0;
			row-gap: 6px;
		}
	}

	.metaTop {
		display: flex;
		flex-direction: column;
		row-gap: 2px;
	}

	.metaName {
		@include text-s;
		@include color-black;

		font-weight: 600;
	}

	.metaKey {
		@include text-xs;
		@include color-black(0.45);

		font-family: monospace;
		word-break: break-all;

		@include respond-to(mobile) {
			display: none;
		}
	}

	.actions {
		display: flex;
		align-items: center;
		column-gap: 6px;
	}

	.btnUpload {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		column-gap: 6px;
		flex: 1;
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid rgba($color-black, 0.15);
		background: transparent;
		cursor: pointer;

		@include text-xs;
		@include color-black;

		font-weight: 600;

		&:hover:not(:disabled) {
			@include color-black-bg(0.06);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.btnDelete {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: 8px;
		border: 1px solid rgba(122, 28, 28, 0.25);
		background: transparent;
		color: rgba(122, 28, 28, 1);
		cursor: pointer;
		flex-shrink: 0;

		&:hover:not(:disabled) {
			background: rgba(122, 28, 28, 0.06);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.btnIcon {
		width: 14px;
		height: 14px;
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
