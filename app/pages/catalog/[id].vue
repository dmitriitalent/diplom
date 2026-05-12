<script setup lang="ts">
import type { Dormitory } from "~/entities/Dormitory";
import type { Product } from "~/entities/Product";
import type { User } from "~/entities/User";
import { useAuthStore } from "~/stores/authStore";
import { useCategoryStore } from "~/stores/categoryStore";
import { useSelfStore } from "~/stores/selfStore";
import type { byIdProduct } from "~~/server/dto/product/byId";
import type { byId } from "~~/server/dto/profile/byId";
import { jwtDecode } from "jwt-decode";
import { useDevice } from "~/composables/device";

const route = useRoute();
const router = useRouter();
const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;

const { at } = useAuthStore();
const isAdmin = jwtDecode(at as string).roles.includes("ADMIN");
const { deviceClassList } = useDevice();

const { self } = useSelfStore();

const { data: product, error } = await useAsyncData(
	"product-full",
	async () => {
		const productFetch = await $fetch<byIdProduct>(
			"/api/product/byId?id=" + route.params.id,
		);

		const ownerFetch = await $fetch<byId>(
			"/api/profile/byId?id=" + productFetch.ownerId,
			{
				headers,
				credentials: "include",
			},
		);

		const owner: User = {
			id:
				typeof ownerFetch.id === "object"
					? ownerFetch.id.value
					: ownerFetch.id,
			login:
				typeof ownerFetch.login === "object"
					? ownerFetch.login.value
					: ownerFetch.login,
			educationEmail:
				typeof ownerFetch.educationEmail === "object"
					? ownerFetch.educationEmail.value
					: ownerFetch.educationEmail,
			birthdate: new Date(
				typeof ownerFetch.birthdate === "object"
					? ownerFetch.birthdate.value
					: ownerFetch.birthdate,
			),
			dormitory: {} as Dormitory,
			building:
				typeof ownerFetch.building === "object"
					? ownerFetch.building.value
					: ownerFetch.building,
			floor:
				typeof ownerFetch.floor === "object"
					? ownerFetch.floor.value
					: ownerFetch.floor,
			room:
				typeof ownerFetch.room === "object"
					? ownerFetch.room.value
					: ownerFetch.room,
			surname:
				typeof ownerFetch.surname === "object"
					? ownerFetch.surname.value
					: ownerFetch.surname,
			name:
				typeof ownerFetch.name === "object"
					? ownerFetch.name.value
					: ownerFetch.name,
			patronymic:
				typeof ownerFetch.patronymic === "object"
					? ownerFetch.patronymic.value
					: ownerFetch.patronymic,
			contacts: [],
			friends: [],
		};

		return {
			category: {},
			description: productFetch.description,
			id: productFetch.id,
			images: productFetch.images,
			name: productFetch.name,
			owner,
			price: productFetch.price,
			publishedAt: productFetch.publishedAt,
			status: productFetch.status,
			updatedAt: productFetch.updatedAt,
			viewTemplate: productFetch.viewTemplate,
		} as Product;
	},
);

const deleteProduct = () => {
	$fetch("/api/product/delete?id=" + product.value?.id, {
		method: "DELETE",
	}).then((res) => {
		useRouter().push("/catalog");
	});
};
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container" v-if="product">
			<div
				v-if="isAdmin || self?.id === product.owner.id"
				:class="$style.adminTools"
			>
				<UiButton :class="$style.delete" @click="deleteProduct"
					>Удалить</UiButton
				>
				<UiButton
					:class="$style.edit"
					@click="router.push('/catalog/edit/' + product.id)"
					>Редактировать</UiButton
				>
			</div>

			<div :class="$style.top">
				<UiGallery :class="$style.gallery" :autoplay="3000" loop>
					<template
						v-for="(image, index) in product.images"
						:key="index"
						v-slot:[index]
					>
						<img
							:class="$style.image"
							:src="`/api/images/byGuid?guid=${image.fileGuid}`"
						/>
					</template>
				</UiGallery>
			</div>

			<div :class="$style.bottom">
				<RouterLink :to="`/profile/${product.owner.id}`">
					<div :class="$style.owner">
						<img
							:src="`/api/images/byGuid?guid=avatar`"
							:class="$style.image"
						/>
						<div :class="$style.name">
							{{
								product.owner.name + " " + product.owner.surname
							}}
						</div>
					</div>
				</RouterLink>
				<h3 :class="$style.name">{{ product.name }}</h3>
				<p :class="$style.description">{{ product.description }}</p>
				<div :class="$style.price">{{ product.price }} рублей</div>
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

	display: flex;
	column-gap: 30px;
	position: relative;

	.adminTools {
		display: flex;
		flex-direction: column;
		row-gap: 10px;

		.delete {
			@include color-error-bg;
		}

		.edit {
			@include color-black-bg(0.08);
		}
	}

	.top {
		width: 100%;
		height: 600px;

		@include respond-to(mobile) {
			height: 280px;
		}

		.gallery {
			@include color-black-bg(0.1);

			height: 100%;
			border-radius: 10px;

			.image {
				width: 100%;
				height: 100%;
				object-fit: contain;
			}
		}
	}

	.bottom {
		display: flex;
		flex-direction: column;
		row-gap: 30px;

		.owner {
			width: fit-content;
			margin-left: auto;
			display: flex;
			align-items: center;
			column-gap: 20px;

			@include respond-to(mobile) {
				margin-left: 0;
			}

			.image {
				width: 50px;
				height: 50px;
				border-radius: 100%;
			}

			.name {
				@include title-m;
			}
		}

		.name {
			@include reset;
			@include title-l;
			@include color-black;

			@include respond-to(mobile) {
				@include title-m;
			}
		}

		.description {
			@include reset;
			@include text-l;
			@include color-black;

			text-indent: 1em;
		}

		.price {
			@include reset;
			@include text-l;
			@include color-black;

			margin-left: auto;

			@include respond-to(mobile) {
				margin-left: 0;
			}
		}
	}
}
</style>
