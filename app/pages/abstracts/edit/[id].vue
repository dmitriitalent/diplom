<script setup lang="ts">
definePageMeta({ middleware: "authenticated" });

useSeoMeta({
	title: "Редактировать конспект",
	robots: "noindex, nofollow",
});

import { useAuthStore } from "~/stores/authStore";
import { useSelfStore } from "~/stores/selfStore";
import { useDevice } from "~/composables/device";
import type { AbstractDtoCreate } from "~~/server/dto/abstract/create";
import type { AbstractDtoById } from "~~/server/dto/abstract/byId";

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const auth = useAuthStore();
const { self } = useSelfStore();
const isAdmin = auth.isAdmin;
const { deviceClassList, isDevice } = useDevice();
const headers = useRequestHeaders(["cookie"]);

const typeOptions = [
	{ value: "lecture", name: "Лекция" },
	{ value: "lab", name: "Лабораторная" },
];

const { data: original } = await useAsyncData<AbstractDtoById>(
	"abstract-edit-" + id,
	() => $fetch<AbstractDtoById>("/api/abstract/byId?id=" + id, { headers }),
);

if (!original.value) {
	throw createError({ statusCode: 404, message: "Конспект не найден" });
}

const isAuthor = original.value.authorId === self?.id;
if (!isAdmin && !isAuthor) {
	await navigateTo("/abstracts/" + id);
}

const form = ref<AbstractDtoCreate>({
	type: original.value.type,
	title: original.value.title,
	subject: original.value.subject,
	description: original.value.description,
	imageIds: [...original.value.imageIds],
});

const existingImageIds = ref<string[]>([...original.value.imageIds]);
const newImageFiles = ref<File[]>([]);
const newImagePreviewUrls = ref<string[]>([]);
const newImageThumbnailUrls = ref<string[]>([]);
const previewChange = ref(0);

const createThumbnail = (file: File, size = 120): Promise<string> =>
	new Promise((resolve) => {
		const img = new Image();
		const url = URL.createObjectURL(file);
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext("2d")!;
			const min = Math.min(img.width, img.height);
			const sx = (img.width - min) / 2;
			const sy = (img.height - min) / 2;
			ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
			canvas.toBlob(
				(blob) => {
					URL.revokeObjectURL(url);
					resolve(URL.createObjectURL(blob!));
				},
				"image/jpeg",
				0.8,
			);
		};
		img.src = url;
	});

const fileInput = ref<HTMLInputElement | null>(null);
const openFile = () => fileInput.value?.click();

const onFileChangeImages = async (e: Event) => {
	const target = e.target as HTMLInputElement;
	if (!target.files) return;
	for (const file of Array.from(target.files)) {
		newImagePreviewUrls.value.push(URL.createObjectURL(file));
		newImageThumbnailUrls.value.push(await createThumbnail(file));
		newImageFiles.value.push(file);
	}
	target.value = "";
	previewChange.value++;
};

const removeExistingImage = (guid: string) => {
	existingImageIds.value = existingImageIds.value.filter((g) => g !== guid);
	previewChange.value++;
};

const removeNewImage = (url: string) => {
	const i = newImagePreviewUrls.value.indexOf(url);
	if (i === -1) return;
	URL.revokeObjectURL(url);
	URL.revokeObjectURL(newImageThumbnailUrls.value[i]!);
	newImagePreviewUrls.value.splice(i, 1);
	newImageThumbnailUrls.value.splice(i, 1);
	newImageFiles.value.splice(i, 1);
	previewChange.value++;
};

const allPreviewCount = computed(
	() => existingImageIds.value.length + newImagePreviewUrls.value.length,
);

const uploadNewImages = async (): Promise<string[]> => {
	const guids: string[] = [];
	await Promise.all(
		newImageFiles.value.map(async (file) => {
			const guid = crypto.randomUUID();
			const fd = new FormData();
			fd.append("file", file);
			fd.append("external_id", guid);
			await $fetch("/api/images/upload", { method: "POST", body: fd });
			guids.push(guid);
		}),
	);
	return guids;
};

const saving = ref(false);

const save = async () => {
	saving.value = true;
	try {
		const newGuids = await uploadNewImages();
		form.value.imageIds = [...existingImageIds.value, ...newGuids];
		await $fetch("/api/abstract/edit?id=" + id, {
			method: "PUT",
			body: form.value,
		});
		router.push("/abstracts/" + id);
	} finally {
		saving.value = false;
	}
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<h1 :class="$style.title">Редактировать</h1>

			<div :class="$style.form">
				<div :class="$style.left">
					<template v-if="allPreviewCount > 0">
						<UiGallery
							:class="$style.gallery"
							:key="previewChange"
							:autoplay="3000"
							loop
						>
							<template
								v-for="(guid, index) in existingImageIds"
								:key="'e' + index"
								v-slot:[index]
							>
								<img
									:class="$style.image"
									:src="`/api/images/byGuid?guid=${guid}`"
								/>
							</template>
							<template
								v-for="(url, i) in newImagePreviewUrls"
								:key="'n' + i"
								v-slot:[existingImageIds.length+i]
							>
								<img :class="$style.image" :src="url" />
							</template>
						</UiGallery>
					</template>
					<template v-else>
						<div :class="$style.placeholder" @click="openFile">
							<Icon
								name="material-symbols:add-box-outline"
								:class="$style.icon"
							/>
						</div>
					</template>

					<div :class="$style.imagesList">
						<template v-if="allPreviewCount > 0">
							<UiGallery
								:class="$style.gallery"
								:key="previewChange"
								:slides-per-view="isDevice('mobile') ? 5 : 6"
								:autoplay="3000"
							>
								<template
									v-for="(guid, index) in existingImageIds"
									:key="'e' + index"
									v-slot:[index]
								>
									<div :class="$style.imageWrapper">
										<UiButton
											unset
											:class="$style.button"
											@click="removeExistingImage(guid)"
										>
											<Icon
												name="material-symbols:delete-outline"
												:class="$style.icon"
											/>
										</UiButton>
										<img
											:class="$style.image"
											:src="`/api/images/byGuid?guid=${guid}`"
										/>
									</div>
								</template>
								<template
									v-for="(url, i) in newImagePreviewUrls"
									:key="'n' + i"
									v-slot:[existingImageIds.length+i]
								>
									<div :class="$style.imageWrapper">
										<UiButton
											unset
											:class="$style.button"
											@click="removeNewImage(url)"
										>
											<Icon
												name="material-symbols:delete-outline"
												:class="$style.icon"
											/>
										</UiButton>
										<img
											:class="$style.image"
											:src="newImageThumbnailUrls[i]"
										/>
									</div>
								</template>
							</UiGallery>
						</template>
						<template v-else>
							<div :class="$style.placeholder" @click="openFile">
								<Icon
									name="material-symbols:add-box-outline"
									:class="$style.icon"
								/>
							</div>
						</template>
					</div>

					<input
						type="file"
						multiple
						hidden
						ref="fileInput"
						@change="onFileChangeImages"
					/>
					<UiButton inset @click="openFile">Прикрепить фото</UiButton>
				</div>

				<div :class="$style.right">
					<div :class="$style.field">
						<label :class="$style.label">Тип</label>
						<UiSelect
							v-model="form.type as any"
							:options="typeOptions"
						/>
					</div>
					<div :class="$style.field">
						<label :class="$style.label">Предмет</label>
						<UiInput v-model="form.subject" />
					</div>
					<div :class="$style.field">
						<label :class="$style.label">Название</label>
						<UiInput v-model="form.title" />
					</div>
					<div :class="$style.field">
						<label :class="$style.label">Описание</label>
						<UiTextarea v-model="form.description" :rows="8" />
					</div>

					<div :class="$style.actions">
						<UiButton @click="router.push('/abstracts/' + id)">
							Отмена
						</UiButton>
						<UiButton accent :disabled="saving" @click="save">
							{{ saving ? "Сохранение…" : "Сохранить" }}
						</UiButton>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;

		display: flex;
		flex-direction: column;
		row-gap: 24px;

		@include respond-to(mobile) {
			@include container(mobile);

			row-gap: 18px;
		}

		.title {
			@include reset;
			@include title-l;
			@include color-black;
		}
	}

	.form {
		display: flex;
		column-gap: 30px;

		@include respond-to(mobile) {
			flex-direction: column;
			row-gap: 20px;
		}

		.left {
			min-width: 460px;
			max-width: 460px;
			display: flex;
			flex-direction: column;
			row-gap: 10px;

			@include respond-to(mobile) {
				min-width: 0;
				max-width: none;
				width: 100%;
			}

			.gallery {
				height: 360px;
				width: 100%;
				border-radius: 10px;

				@include respond-to(mobile) {
					height: 240px;
				}

				.image {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}
			}

			.placeholder {
				display: flex;
				justify-content: center;
				align-items: center;
				height: 360px;
				aspect-ratio: 1;
				cursor: pointer;
				background-color: rgba($color-black-rgb, 0.1);
				border-radius: 10px;

				@include respond-to(mobile) {
					height: 240px;
					aspect-ratio: unset;
					width: 100%;
				}

				.icon {
					height: 50%;
					width: 50%;
					opacity: 0.5;
				}
			}

			.imagesList {
				width: 100%;
				height: 70px;
				display: flex;
				column-gap: 5px;

				.gallery {
					height: 100%;
					width: 100%;

					.imageWrapper {
						position: relative;
						height: 100%;
						aspect-ratio: 1;

						.button {
							@include color-white-bg;

							z-index: 2;
							position: absolute;
							top: 5px;
							right: 5px;
							height: 20px;
							width: 20px;
							padding: 0;
						}

						.icon {
							height: 12px;
							width: 12px;
							opacity: 0.5;
						}

						.image {
							z-index: 1;
							position: absolute;
							top: 0;
							left: 0;
							height: 100%;
							aspect-ratio: 1;
							object-fit: cover;
							border-radius: 10px;
						}
					}
				}

				.placeholder {
					display: flex;
					justify-content: center;
					align-items: center;
					height: 100%;
					width: 70px;
					cursor: pointer;
					background-color: rgba($color-black-rgb, 0.1);
					border-radius: 10px;

					.icon {
						height: 50%;
						width: 50%;
						opacity: 0.5;
					}
				}
			}
		}

		.right {
			display: flex;
			flex-direction: column;
			row-gap: 20px;
			width: 100%;

			.field {
				display: flex;
				flex-direction: column;
				row-gap: 8px;

				.label {
					@include text-m;
					@include color-black;

					opacity: 0.75;
				}
			}

			.actions {
				display: flex;
				column-gap: 10px;
				justify-content: flex-end;
			}
		}
	}
}
</style>
