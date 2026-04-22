<script setup lang="ts">
import type { NewsDtoCreate } from "~~/server/dto/news/create";

const imagePreviewUrls = ref<Array<string>>([]);
const imageFiles = ref<Array<File>>([]);
const previewChange = ref<number>(0);

const fileInput = ref<HTMLInputElement | null>(null);
const openFile = () => {
	fileInput.value?.click();
};

const onFileChangeImages = (e: Event) => {
	previewChange.value += 1;
	const target = e.target as HTMLInputElement;
	const files = target.files;

	if (!files) return;

	for (const file of Array.from(files)) {
		const url = URL.createObjectURL(file);
		imagePreviewUrls.value.push(url);
		imageFiles.value.push(file);
	}

	target.value = "";
};

const removeImage = (url: string) => {
	const i = imagePreviewUrls.value.findIndex((u) => u === url);
	if (i === -1) return;

	imagePreviewUrls.value.splice(i, 1);
	imageFiles.value.splice(i, 1);

	URL.revokeObjectURL(url);

	previewChange.value += 1;
};

const form = ref<NewsDtoCreate>({
	content: "",
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

const createNews = async () => {
	await uploadImages();

	$fetch("/api/news/create", {
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
	<div :class="$style.wrapper">
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
								:slides-per-view="6"
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
										<img :class="$style.image" :src="url" />
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
						<h3 :class="$style.label">Заголовок</h3>
						<UiInput
							v-model="form.title"
							:class="$style.input"
							placeholder="В четверг намечается что-то очень страшное"
						/>
					</div>

					<div :class="$style.field">
						<h3 :class="$style.label">Содержание</h3>
						<UiTextarea
							v-model="form.content"
							:class="$style.textarea"
							:rows="10"
							placeholder="Ожидается сдача отчетов по преддипломной практике"
						></UiTextarea>
					</div>

					<UiButton :class="$style.submit" accent @click="createNews">
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
	}

	.form {
		display: flex;
		column-gap: 30px;

		.left {
			min-width: 500px;
			max-width: 500px;
			display: flex;
			flex-direction: column;
			row-gap: 10px;

			.gallery {
				height: 400px;
				width: 100%;
				border-radius: 10px;

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
					aspect-ratio: 1;
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
