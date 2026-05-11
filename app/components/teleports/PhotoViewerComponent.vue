<script setup lang="ts">
const props = defineProps({
	isOpened: {
		type: Boolean,
		required: true,
	},
	src: {
		type: String,
		default: "",
	},
	canEdit: {
		type: Boolean,
		default: false,
	},
	canDelete: {
		type: Boolean,
		default: false,
	},
	uploading: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits<{
	(e: "update:isOpened", v: boolean): void;
	(e: "close"): void;
	(e: "replace", file: File): void;
	(e: "delete"): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const close = () => {
	emit("update:isOpened", false);
	emit("close");
};

const onBackdropClick = () => close();

const onReplaceClick = () => fileInput.value?.click();

const onFileChange = (e: Event) => {
	const target = e.target as HTMLInputElement;
	const file = target.files?.[0];
	if (file) emit("replace", file);
	target.value = "";
};

const onDeleteClick = () => emit("delete");

const onEsc = (e: KeyboardEvent) => {
	if (e.key === "Escape" && props.isOpened) close();
};

onMounted(() => window.addEventListener("keydown", onEsc));
onBeforeUnmount(() => window.removeEventListener("keydown", onEsc));
</script>

<template>
	<Teleport to="body">
		<div v-if="isOpened" :class="$style.overlay" @click="onBackdropClick">
			<div :class="$style.dialog" @click.stop>
				<UiButton unset :class="$style.closeBtn" @click="close">
					<Icon
						name="material-symbols:close-rounded"
						:class="$style.closeIcon"
					/>
				</UiButton>

				<div :class="$style.imageWrapper">
					<img v-if="src" :src="src" :class="$style.image" alt="" />
					<div v-else :class="$style.placeholder">
						<Icon
							name="material-symbols:image-outline-rounded"
							:class="$style.placeholderIcon"
						/>
						<span>Нет изображения</span>
					</div>
				</div>

				<div v-if="canEdit || canDelete" :class="$style.actions">
					<UiButton
						v-if="canEdit"
						accent
						:disabled="uploading"
						@click="onReplaceClick"
					>
						<Icon
							name="material-symbols:upload-rounded"
							:class="$style.btnIcon"
						/>
						{{ uploading ? "Загрузка..." : "Заменить фото" }}
					</UiButton>
					<UiButton
						v-if="canDelete && src"
						:class="$style.deleteBtn"
						:disabled="uploading"
						@click="onDeleteClick"
					>
						<Icon
							name="material-symbols:delete-outline-rounded"
							:class="$style.btnIcon"
						/>
						Удалить
					</UiButton>
				</div>

				<input
					ref="fileInput"
					type="file"
					accept="image/*"
					hidden
					@change="onFileChange"
				/>
			</div>
		</div>
	</Teleport>
</template>

<style module lang="scss">
.overlay {
	position: fixed;
	inset: 0;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba($color-black, 0.55);
	backdrop-filter: blur(8px);
	padding: 32px 16px;
	box-sizing: border-box;
}

.dialog {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	row-gap: 20px;
	max-width: 90vw;
	max-height: 90vh;
}

.closeBtn {
	@include color-white-bg(0.85);
	@include shadow;

	position: absolute;
	top: -8px;
	right: -8px;
	z-index: 2;
	width: 38px;
	height: 38px;
	border-radius: 50%;
	backdrop-filter: blur(8px);
}

.closeIcon {
	@include color-black;

	width: 22px;
	height: 22px;
}

.imageWrapper {
	@include color-white-bg(0.72);
	@include shadow;

	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 16px;
	padding: 12px;
	max-width: 90vw;
	max-height: calc(90vh - 80px);
	backdrop-filter: blur(12px);
	overflow: hidden;
}

.image {
	display: block;
	max-width: 100%;
	max-height: calc(90vh - 104px);
	width: auto;
	height: auto;
	border-radius: 10px;
	object-fit: contain;
}

.placeholder {
	@include text-m;
	@include color-black(0.5);

	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	row-gap: 12px;
	width: 60vw;
	max-width: 480px;
	height: 50vh;
	max-height: 360px;
}

.placeholderIcon {
	width: 64px;
	height: 64px;
	opacity: 0.5;
}

.actions {
	display: flex;
	column-gap: 12px;
	flex-wrap: wrap;
	justify-content: center;
}

.deleteBtn {
	@include color-error-bg(1);
}

.btnIcon {
	width: 18px;
	height: 18px;
	margin-right: 6px;
}
</style>
