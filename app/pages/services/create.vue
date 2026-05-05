<script setup lang="ts">
import type { ServiceDtoCreate } from "~~/server/dto/service/create";

const router = useRouter();

const imagePreviewUrls = ref<string[]>([]);
const imageFiles = ref<File[]>([]);
const previewChange = ref(0);

const fileInput = ref<HTMLInputElement | null>(null);
const openFile = () => fileInput.value?.click();

const onFileChangeImages = (e: Event) => {
	const target = e.target as HTMLInputElement;
	if (!target.files) return;
	for (const file of Array.from(target.files)) {
		imagePreviewUrls.value.push(URL.createObjectURL(file));
		imageFiles.value.push(file);
	}
	target.value = "";
	previewChange.value++;
};

const removeImage = (url: string) => {
	const i = imagePreviewUrls.value.indexOf(url);
	if (i === -1) return;
	imagePreviewUrls.value.splice(i, 1);
	imageFiles.value.splice(i, 1);
	URL.revokeObjectURL(url);
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
			await $fetch("/api/images/upload", { method: "POST", body: formData });
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
	<div :class="$style.wrapper">
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
											/>
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
						<h3 :class="$style.label">Цена (₽)</h3>
						<UiInput
							v-model="form.price"
							type="number"
							:class="$style.input"
							placeholder="500"
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
