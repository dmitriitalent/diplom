<script setup lang="ts">
import type { ServiceDtoCreate } from "~~/server/dto/service/create";
import { useDevice } from "~/composables/device";
import { SERVICE_TEMPLATES } from "~/constants/templates";

const router = useRouter();
const { deviceClassList, isDevice } = useDevice();

const imagePreviewUrls = ref<string[]>([]);
const imageThumbnailUrls = ref<string[]>([]);
const imageFiles = ref<File[]>([]);
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
		imagePreviewUrls.value.push(URL.createObjectURL(file));
		imageThumbnailUrls.value.push(await createThumbnail(file));
		imageFiles.value.push(file);
	}
	target.value = "";
	previewChange.value++;
};

const removeImage = (url: string) => {
	const i = imagePreviewUrls.value.indexOf(url);
	if (i === -1) return;
	URL.revokeObjectURL(url);
	URL.revokeObjectURL(imageThumbnailUrls.value[i]);
	imagePreviewUrls.value.splice(i, 1);
	imageThumbnailUrls.value.splice(i, 1);
	imageFiles.value.splice(i, 1);
	previewChange.value++;
};

const form = ref<ServiceDtoCreate>({
	description: "",
	images: [],
	name: "",
	price: 0,
	viewTemplate: 0,
});

const uploadImages = async () => {
	await Promise.all(
		imageFiles.value.map(async (file, index) => {
			const guid = crypto.randomUUID();
			const formData = new FormData();
			formData.append("file", file);
			formData.append("external_id", guid);
			await $fetch("/api/images/upload", {
				method: "POST",
				body: formData,
			});
			form.value.images.push({ fileGuid: guid, sortOrder: index });
		}),
	);
};

const saving = ref(false);

const createService = async () => {
	saving.value = true;
	try {
		await uploadImages();
		const res = await $fetch<{ id: string }>("/api/service/create", {
			method: "POST",
			body: form.value,
		});
		router.push("/services/" + res.id);
	} finally {
		saving.value = false;
	}
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<div :class="$style.form">
				<div :class="$style.left">
					<template v-if="imagePreviewUrls.length > 0">
						<UiGallery
							:class="$style.gallery"
							:key="previewChange"
							:autoplay="3000"
							loop
						>
							<template
								v-for="(url, index) in imagePreviewUrls"
								:key="index"
								v-slot:[index]
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
						<template v-if="imagePreviewUrls.length > 0">
							<UiGallery
								:class="$style.gallery"
								:key="previewChange"
								:slides-per-view="isDevice('mobile') ? 5 : 6"
								:autoplay="3000"
							>
								<template
									v-for="(url, index) in imagePreviewUrls"
									:key="index"
									v-slot:[index]
								>
									<div :class="$style.imageWrapper">
										<UiButton
											unset
											:class="$style.button"
											@click="removeImage(url)"
										>
											<Icon
												name="material-symbols:delete-outline"
												:class="$style.icon"
											/>
										</UiButton>
										<img :class="$style.image" :src="imageThumbnailUrls[index]" />
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
						<h3 :class="$style.label">Название</h3>
						<UiInput
							v-model="form.name"
							:class="$style.input"
							placeholder="Репетиторство по математике"
						/>
					</div>

					<div :class="$style.field">
						<h3 :class="$style.label">Описание</h3>
						<UiTextarea
							v-model="form.description"
							:class="$style.textarea"
							:rows="8"
							placeholder="Помогу подготовиться к экзамену"
						/>
					</div>

					<div :class="$style.field">
						<h3 :class="$style.label">
							Цена (<span :class="$style.currency">₽</span>)
						</h3>
						<UiInput
							v-model="form.price"
							type="number"
							:class="$style.input"
							placeholder="500"
						/>
					</div>

					<div :class="$style.field">
						<h3 :class="$style.label">Шаблон оформления</h3>
						<UiTemplatePicker
							:templates="SERVICE_TEMPLATES"
							v-model="form.viewTemplate"
						/>
					</div>

					<UiButton accent :disabled="saving" @click="createService">
						{{ saving ? "Публикация..." : "Опубликовать" }}
					</UiButton>
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
		row-gap: 30px;

		@include respond-to(mobile) {
			@include container(mobile);

			row-gap: 20px;
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
			min-width: 500px;
			max-width: 500px;
			display: flex;
			flex-direction: column;
			row-gap: 10px;

			@include respond-to(mobile) {
				min-width: 0;
				max-width: none;
				width: 100%;
			}

			.gallery {
				height: 400px;
				width: 100%;
				border-radius: 10px;

				@include respond-to(mobile) {
					height: 260px;
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
				height: 400px;
				aspect-ratio: 1;
				cursor: pointer;
				background-color: rgba($color-black, 0.1);
				border-radius: 10px;

				@include respond-to(mobile) {
					height: 260px;
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
					background-color: rgba($color-black, 0.1);
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
			row-gap: 30px;
			width: 100%;

			.field {
				display: flex;
				flex-direction: column;
				row-gap: 10px;

				.label {
					@include reset;
					@include text-m;
					@include color-black;

					.currency {
						font-family: Roboto;
						font-weight: 300;
					}
				}
			}
		}
	}
}
</style>
