<script setup lang="ts">
import type { ActivityDtoCreate } from "~~/server/dto/activity/create";
import { useDevice } from "~/composables/device";

const { deviceClassList, isDevice } = useDevice();

const imagePreviewUrls = ref<Array<string>>([]);
const imageThumbnailUrls = ref<Array<string>>([]);
const imageFiles = ref<Array<File>>([]);
const previewChange = ref<number>(0);

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
const openFile = () => {
	fileInput.value?.click();
};

const onFileChangeImages = async (e: Event) => {
	const target = e.target as HTMLInputElement;
	const files = target.files;

	if (!files) return;

	for (const file of Array.from(files)) {
		const url = URL.createObjectURL(file);
		imagePreviewUrls.value.push(url);
		imageThumbnailUrls.value.push(await createThumbnail(file));
		imageFiles.value.push(file);
	}

	target.value = "";
	previewChange.value += 1;
};

const removeImage = (url: string) => {
	const i = imagePreviewUrls.value.findIndex((u) => u === url);
	if (i === -1) return;

	URL.revokeObjectURL(url);
	URL.revokeObjectURL(imageThumbnailUrls.value[i]);
	imagePreviewUrls.value.splice(i, 1);
	imageThumbnailUrls.value.splice(i, 1);
	imageFiles.value.splice(i, 1);

	previewChange.value += 1;
};

const startTime = ref<Date>();
const endTime = ref<Date>();
const form = ref<ActivityDtoCreate>({
	description: "",
	endTime: "",
	isPrivate: false,
	location: "",
	startTime: "",
	imageIds: [],
	title: "",
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

			form.value.imageIds.push(guid);
		}),
	);
};

const createActivity = async () => {
	await uploadImages();
	form.value.startTime = startTime.value!.toISOString();
	form.value.endTime = endTime.value!.toISOString();

	console.log(form.value.endTime);

	$fetch("/api/activity/create", {
		method: "POST",
		body: form.value,
	})
		.then((res) => {
			console.log(res);
		})
		.catch((err) => {
			console.log(err);
		});
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<div :class="$style.form">
				<div :class="$style.left">
					<template v-if="imagePreviewUrls.length != 0">
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
							></Icon>
						</div>
					</template>

					<div :class="$style.imagesList">
						<template v-if="imagePreviewUrls.length != 0">
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
											></Icon>
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
								></Icon>
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
							v-model="form.title"
							:class="$style.input"
							placeholder="Играем в настолки"
						/>
					</div>

					<div :class="$style.field">
						<h3 :class="$style.label">Описание</h3>
						<UiTextarea
							v-model="form.description"
							:class="$style.textarea"
							:rows="10"
							placeholder="Сегодня будем играть в монополию"
						></UiTextarea>
					</div>

					<div :class="$style.field">
						<h3 :class="$style.label">Место</h3>
						<UiInput
							v-model="form.location"
							:class="$style.input"
							placeholder="В комнате 2413"
						/>
					</div>

					<div :class="$style.field">
						<h3 :class="$style.label">Время начала</h3>
						<UiDatePicker
							placeholder="Время начала"
							left-icon-name=""
							v-model="startTime"
							enable-time
						/>
					</div>

					<div :class="$style.field">
						<h3 :class="$style.label">Время окончания</h3>
						<UiDatePicker
							placeholder="Время окончания"
							left-icon-name=""
							v-model="endTime"
							enable-time
						/>
					</div>

					<div :class="$style.field">
						<h3 :class="$style.label">Приватность</h3>
						<UiCheckbox
							v-model="form.isPrivate"
							:class="$style.input"
							name="Закрытое мероприятие"
						/>
					</div>

					<UiButton
						:class="$style.submit"
						accent
						@click="createActivity"
					>
						Предложить к публикации
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
					background-color: pink;
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
				}
			}
		}
	}
}
</style>
