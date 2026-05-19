<script setup lang="ts">
definePageMeta({ middleware: "authenticated" });

useSeoMeta({
	title: "Конспекты",
	description:
		"Конспекты лекций и лабораторных работ от резидентов Hostelite.",
});

import type { Abstract } from "~/entities/Abstract";
import type { byId } from "~~/server/dto/profile/byId";
import type { AbstractListDto } from "~~/server/dto/abstract/list";
import { useDevice } from "~/composables/device";

const { deviceClassList } = useDevice();
const headers = useRequestHeaders(["cookie"]);

const search = ref("");

const lectures = ref<Array<Abstract>>([]);
const labs = ref<Array<Abstract>>([]);
const loading = ref(false);

const mapAbstract = async (
	f: AbstractListDto["items"][number],
): Promise<Abstract> => {
	let author;
	try {
		const profile = await $fetch<byId>(
			"/api/profile/byId?id=" + f.authorId,
			{ headers },
		);
		author = unwrapProfile(profile);
	} catch {
		author = undefined;
	}
	return {
		id: f.id,
		type: f.type,
		title: f.title,
		subject: f.subject,
		description: f.description,
		imageIds: f.imageIds,
		authorId: f.authorId,
		author,
		likes: [],
		likeCount: f.likeCount,
		userLiked: f.userLiked,
		createdAt: f.createdAt,
		updatedAt: f.updatedAt,
	};
};

const fetchList = async (): Promise<void> => {
	loading.value = true;
	try {
		const query: Record<string, string> = {};
		if (search.value.trim()) query.search = search.value.trim();
		const res = await $fetch<AbstractListDto>("/api/abstract/list", {
			headers,
			query,
		});
		const items: Abstract[] = [];
		for (const f of res?.items ?? []) {
			items.push(await mapAbstract(f));
		}
		lectures.value = items.filter((x) => x.type === "lecture");
		labs.value = items.filter((x) => x.type === "lab");
	} finally {
		loading.value = false;
	}
};

await fetchList();

let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(search, () => {
	if (searchTimer) clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		fetchList();
	}, 300);
});
</script>

<template>
	<div :class="[$style.wrapper, ...deviceClassList]">
		<div :class="$style.container">
			<div :class="$style.head">
				<h1 :class="$style.pageTitle">Конспекты</h1>
				<div :class="$style.headActions">
					<RouterLink to="/abstracts/create">
						<UiButton accent>Загрузить конспект</UiButton>
					</RouterLink>
				</div>
			</div>

			<div :class="$style.searchRow">
				<UiInput
					v-model="search"
					placeholder="Поиск по предмету…"
					left-icon-name="mdi:magnify"
				/>
			</div>

			<div :class="$style.columns">
				<section :class="$style.column">
					<h2 :class="$style.colTitle">
						<Icon
							name="mdi:book-open-page-variant-outline"
							:class="$style.colIcon"
						/>
						Лекции
						<span :class="$style.colCount">
							({{ lectures.length }})
						</span>
					</h2>
					<p
						v-if="!loading && lectures.length === 0"
						:class="$style.empty"
					>
						{{ search ? "Ничего не найдено" : "Лекций пока нет" }}
					</p>
					<AbstractPlateComponent
						v-for="a in lectures"
						:key="a.id"
						:abstract="a"
					/>
				</section>

				<section :class="$style.column">
					<h2 :class="$style.colTitle">
						<Icon
							name="mdi:flask-outline"
							:class="$style.colIcon"
						/>
						Лабораторные
						<span :class="$style.colCount">
							({{ labs.length }})
						</span>
					</h2>
					<p
						v-if="!loading && labs.length === 0"
						:class="$style.empty"
					>
						{{
							search
								? "Ничего не найдено"
								: "Лабораторных пока нет"
						}}
					</p>
					<AbstractPlateComponent
						v-for="a in labs"
						:key="a.id"
						:abstract="a"
					/>
				</section>
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
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		column-gap: 12px;
		flex-wrap: wrap;
		row-gap: 10px;

		.pageTitle {
			@include reset;
			@include title-l;
			@include color-black;
		}
	}

	.headActions {
		display: flex;
		column-gap: 8px;
	}

	.searchRow {
		max-width: 520px;
	}

	.columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;

		@include respond-to(mobile) {
			grid-template-columns: 1fr;
			gap: 18px;
		}
	}

	.column {
		display: flex;
		flex-direction: column;
		row-gap: 12px;
		min-width: 0;
	}

	.colTitle {
		@include reset;
		@include title-s;
		@include color-black;

		display: flex;
		align-items: center;
		column-gap: 8px;
		opacity: 0.75;

		.colCount {
			@include text-s;
			opacity: 0.6;
			font-weight: 400;
		}
	}

	.colIcon {
		width: 22px;
		height: 22px;
		opacity: 0.6;
	}

	.empty {
		@include text-s;
		@include color-black(0.45);

		text-align: center;
		padding: 20px;
		margin: 0;
	}
}
</style>
