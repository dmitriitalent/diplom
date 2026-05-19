<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PhotoViewerComponent from "~/components/teleports/PhotoViewerComponent.vue";
import { useDevice } from "~/composables/device";
import type { GalleryItemDto } from "~~/server/dto/activityGallery/list";

const props = defineProps<{
	activityId: string;
	canUpload: boolean;
	selfUserId: string;
}>();

const { isDevice } = useDevice();

const items = ref<GalleryItemDto[]>([]);
const loading = ref(false);
const uploading = ref(false);
const error = ref<string | null>(null);

const fileInput = ref<HTMLInputElement | null>(null);

const viewerOpen = ref(false);
const viewerSrc = ref("");
const viewerPhotoId = ref<string | null>(null);
const viewerUploadedBy = ref<string | null>(null);

const fetchList = async (): Promise<void> => {
	loading.value = true;
	try {
		const res = await $fetch<{ items: GalleryItemDto[] }>(
			"/api/activity-gallery/list",
			{ query: { id: props.activityId } },
		);
		items.value = res.items ?? [];
	} catch {
		items.value = [];
	} finally {
		loading.value = false;
	}
};

onMounted(fetchList);

const pickFiles = (): void => {
	if (!props.canUpload) return;
	fileInput.value?.click();
};

const uploadOne = async (file: File): Promise<void> => {
	const formData = new FormData();
	formData.append("file", file);
	await $fetch<GalleryItemDto>("/api/activity-gallery/upload", {
		method: "POST",
		query: { id: props.activityId },
		body: formData,
	});
};

const onFilesChosen = async (e: Event): Promise<void> => {
	const target = e.target as HTMLInputElement;
	const files = target.files;
	if (!files || files.length === 0) return;
	uploading.value = true;
	error.value = null;
	try {
		for (const f of Array.from(files)) {
			await uploadOne(f);
		}
		await fetchList();
	} catch (e: unknown) {
		const err = e as { data?: { message?: string }; message?: string };
		error.value = err.data?.message ?? err.message ?? "Ошибка загрузки";
	} finally {
		uploading.value = false;
		target.value = "";
	}
};

const aspect = (p: GalleryItemDto): number =>
	p.width > 0 && p.height > 0 ? p.height / p.width : 1;

const columns = computed<GalleryItemDto[][]>(() => {
	if (isDevice("mobile")) return [items.value];
	const sorted = [...items.value].sort(
		(a, b) => aspect(b) - aspect(a),
	);
	const n = sorted.length;
	const base = Math.floor(n / 3);
	const rem = n % 3;
	const targets = [
		base + (rem > 0 ? 1 : 0),
		base + (rem > 1 ? 1 : 0),
		base,
	];
	const cols: GalleryItemDto[][] = [[], [], []];

	let lo = 0;
	let hi = n - 1;

	let progress = true;
	while (progress && lo < hi) {
		progress = false;
		for (let c = 0; c < 3; c++) {
			const free = targets[c]! - cols[c]!.length;
			if (free >= 2 && lo < hi) {
				cols[c]!.push(sorted[lo++]!);
				cols[c]!.push(sorted[hi--]!);
				progress = true;
			}
		}
	}

	let colIdx = 0;
	while (lo <= hi) {
		let tries = 0;
		while (cols[colIdx]!.length >= targets[colIdx]! && tries < 3) {
			colIdx = (colIdx + 1) % 3;
			tries++;
		}
		if (tries >= 3) break;
		cols[colIdx]!.push(sorted[lo++]!);
		colIdx = (colIdx + 1) % 3;
	}

	return cols;
});

const openViewer = (p: GalleryItemDto): void => {
	viewerSrc.value = p.url;
	viewerPhotoId.value = p.id;
	viewerUploadedBy.value = p.uploadedBy;
	viewerOpen.value = true;
};

const canDeleteCurrent = computed<boolean>(
	() => viewerUploadedBy.value === props.selfUserId,
);

const onDelete = async (): Promise<void> => {
	if (!viewerPhotoId.value) return;
	try {
		await $fetch("/api/activity-gallery/photo", {
			method: "DELETE",
			query: {
				activityId: props.activityId,
				photoId: viewerPhotoId.value,
			},
		});
		viewerOpen.value = false;
		await fetchList();
	} catch (e: unknown) {
		const err = e as { data?: { message?: string }; message?: string };
		error.value = err.data?.message ?? err.message ?? "Ошибка удаления";
	}
};
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.header">
			<h2 :class="$style.title">Фото участников</h2>
			<UiButton
				v-if="canUpload"
				accent
				:disabled="uploading"
				@click="pickFiles"
			>
				<Icon
					name="material-symbols:upload-rounded"
					:class="$style.icon"
				/>
				{{ uploading ? "Загрузка..." : "Загрузить" }}
			</UiButton>
			<input
				ref="fileInput"
				type="file"
				accept="image/*"
				multiple
				hidden
				@change="onFilesChosen"
			/>
		</div>

		<p v-if="error" :class="$style.error">{{ error }}</p>

		<p
			v-if="!loading && items.length === 0"
			:class="$style.empty"
		>
			Пока никто не загрузил фото.
		</p>

		<div v-else :class="$style.columns">
			<div
				v-for="(col, ci) in columns"
				:key="ci"
				:class="$style.column"
			>
				<div
					v-for="p in col"
					:key="p.id"
					:class="$style.tile"
					@click="openViewer(p)"
				>
					<img
						:src="p.url"
						:class="$style.img"
						loading="lazy"
						alt=""
					/>
				</div>
			</div>
		</div>

		<PhotoViewerComponent
			v-model:is-opened="viewerOpen"
			:src="viewerSrc"
			:can-delete="canDeleteCurrent"
			@delete="onDelete"
		/>
	</div>
</template>

<style module lang="scss">
.wrapper {
	display: flex;
	flex-direction: column;
	row-gap: 16px;
	width: 100%;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 12px;

	.title {
		@include reset;
		@include title-m;
		@include color-black;
	}

	.icon {
		width: 18px;
		height: 18px;
		margin-right: 6px;
	}
}

.error {
	@include text-s;
	@include color-error-bg;

	padding: 8px 12px;
	border-radius: 8px;
	margin: 0;
}

.empty {
	@include text-s;
	@include color-black;

	opacity: 0.55;
	text-align: center;
	margin: 0;
}

.columns {
	display: flex;
	column-gap: 4px;

	@include respond-to(mobile) {
		flex-direction: column;
		column-gap: 0;
	}

	.column {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		row-gap: 4px;
	}
}

.tile {
	width: 100%;
	cursor: zoom-in;
	border-radius: 6px;
	overflow: hidden;
	background: rgba($color-black-rgb, 0.06);
	line-height: 0;

	.img {
		width: 100%;
		height: auto;
		display: block;
		object-fit: cover;
		transition: transform $transition-fast;
	}

	&:hover .img {
		transform: scale(1.02);
	}
}
</style>
