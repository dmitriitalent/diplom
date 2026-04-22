<script setup lang="ts">
import { useSelfStore } from "~/stores/selfStore";

type Tabs = "info" | "tools";

const { self, addFriend } = useSelfStore();

const tab: Ref<Tabs> = ref("tools");

const onAddFriend = () => {
	addFriend();
};
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.container">
			<div :class="$style.header">
				<UiImage
					:class="$style.bg"
					src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrTWrj1qZCYHNVihT9j9nBz6WzlRH55ELjsQ&s"
				></UiImage>

				<UiImage
					:class="$style.avatar"
					:src="`/api/images/byGuid?guid=avatar`"
				></UiImage>

				<UiTransition name="fade-right">
					<div v-show="tab == 'info'" :class="$style.tab">
						<div :class="$style.field">
							<div :class="$style.key">Общежитие:</div>
							<div :class="$style.value">
								{{ self?.dormitory.address }}
							</div>
						</div>
						<div :class="$style.field">
							<div :class="$style.key">Корпус:</div>
							<div :class="$style.value">
								{{ self?.building.value }}
							</div>
						</div>
						<div :class="$style.field">
							<div :class="$style.key">Этаж:</div>
							<div :class="$style.value">
								{{ self?.floor.value }}
							</div>
						</div>
						<div :class="$style.field">
							<div :class="$style.key">Комната:</div>
							<div :class="$style.value">
								{{ self?.room.value }}
							</div>
						</div>
					</div>
				</UiTransition>

				<UiTransition name="fade-right">
					<div
						v-show="tab == 'tools'"
						:class="[$style.tab, $style.tools]"
					>
						<div :class="$style.column">
							<RouterLink to="self/settings">
								<UiButton :class="$style.tool" size="custom"
									><Icon
										:class="$style.icon"
										name="material-symbols:drive-file-rename-outline-outline-rounded"
									></Icon
								></UiButton>
							</RouterLink>
							<UiButton :class="$style.tool" size="custom"
								><Icon
									:class="$style.icon"
									name="material-symbols:drive-file-rename-outline-outline-rounded"
								></Icon
							></UiButton>
						</div>
						<div :class="$style.column">
							<RouterLink to="self/friends">
								<UiButton :class="$style.tool" size="custom"
									><Icon
										:class="$style.icon"
										name="material-symbols:drive-file-rename-outline-outline-rounded"
									></Icon
								></UiButton>
							</RouterLink>
							<UiButton :class="$style.tool" size="custom"
								><Icon
									:class="$style.icon"
									name="material-symbols:drive-file-rename-outline-outline-rounded"
								></Icon
							></UiButton>
							<UiButton :class="$style.tool" size="custom"
								><Icon
									:class="$style.icon"
									name="material-symbols:drive-file-rename-outline-outline-rounded"
								></Icon
							></UiButton>
						</div>
					</div>
				</UiTransition>

				<UiButton
					:class="$style.showMore"
					inset
					@click="
						tab = tab === 'info' ? (tab = 'tools') : (tab = 'info')
					"
					>{{
						tab === "info" ? "Закрыть" : "Больше информации"
					}}</UiButton
				>
			</div>

			<div :class="$style.content">
				<div :class="$style.profile">
					<h1 v-if="self" :class="$style.name">
						{{ self.name.value }} {{ self.surname.value }}
					</h1>
					<div v-else :class="$style.name">Имя Фамилия</div>

					<div :class="$style.wall">
						<UiAppear>
							<div :class="$style.createThread">
								<UiTextarea :rows="3"></UiTextarea>
								<UiButton :class="$style.submit" accent>
									Опубликовать
								</UiButton>
							</div>
						</UiAppear>
						<div :class="$style.threads">
							<UiAppear
								v-for="(thread, index) in [1, 2, 3, 4, 5]"
								:delay="100 * (index + 3)"
							>
								<div :class="$style.thread">
									{{ thread }}
								</div>
							</UiAppear>
						</div>
					</div>
				</div>

				<div :class="$style.platforms">
					<UiAppear
						v-for="(links, index) in [
							[1, 2, 3, 4, 5, 6],
							[1, 2, 3, 4],
							[1, 2],
						]"
						:delay="100 * (index + 2)"
					>
						<div :class="$style.links">
							<UiGallery
								:autoplay="3000"
								:slidesPerView="3"
								:spaceBetween="10"
								:loop="links.length >= 3"
								innerShadow
								:class="$style.gallery"
							>
								<template
									:key="index"
									v-for="(product, index) in links"
									v-slot:[index]
								>
									<div :class="$style.link">
										{{ product }}
									</div>
								</template>
							</UiGallery>
						</div>
					</UiAppear>
				</div>
			</div>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;

		border-radius: 10px;
		padding-bottom: 100px;
	}

	.header {
		display: flex;
		position: relative;

		.bg {
			height: 200px;
			width: 100%;
			overflow: hidden;
			border-radius: 10px;
		}

		.avatar {
			position: absolute;
			left: 200px;
			bottom: -30px;
			transform: translate(-50%, 0);

			height: 200px;
			width: 200px;
			border-radius: 100px;
			overflow: hidden;
		}

		.tab {
			$width: 600px;

			background: linear-gradient(
				0.25turn,
				rgba($color-white, 0) 0%,
				rgba($color-white, 0.6) 40%,
				rgba($color-white, 0.9)
			);
			height: 100%;
			width: $width;
			position: absolute;
			top: 0;
			right: 0;
			display: flex;
			flex-direction: column;
			align-items: end;
			padding: 20px 20px 20px 20px;
			box-sizing: border-box;
			row-gap: 10px;

			.field {
				@include text-m;
				@include color-black;

				width: 60%;
				display: flex;
				justify-content: space-between;
			}

			&.tools {
				row-gap: unset;
				flex-direction: row;
				justify-content: end;
				align-items: start;

				.column {
					display: flex;
					flex-direction: column;
					justify-content: start;
					row-gap: 8px;

					&:first-child {
						margin-top: 18px;
					}

					.tool {
						transform: rotate(45deg);
						padding: 6px;

						.icon {
							transform: rotate(-45deg);
							width: 16px;
							height: 16px;
						}
					}
				}
			}
		}

		.showMore {
			position: absolute;
			bottom: 10px;
			right: 10px;
		}
	}

	.content {
		display: flex;
		justify-content: space-between;
		column-gap: 30px;

		.profile {
			display: flex;
			flex-direction: column;
			row-gap: 30px;
			margin-top: 40px;
			width: 100%;

			.name {
				@include reset;
				@include title-m;
				@include color-black;
			}

			.wall {
				display: flex;
				flex-direction: column;
				row-gap: 40px;

				.createThread {
					height: fit-content;
					width: 100%;
					display: flex;
					flex-direction: column;
					row-gap: 10px;

					.submit {
						width: 150px;
						margin-left: auto;
					}
				}

				.threads {
					display: flex;
					flex-direction: column;
					row-gap: 20px;

					.thread {
						@include shadow;

						border-radius: 10px;
						padding: 20px;
						box-sizing: border-box;
					}
				}
			}
		}

		.platforms {
			$platformWidth: 550px;

			margin-top: 20px;
			display: flex;
			flex-direction: column;
			row-gap: 15px;
			width: $platformWidth;

			.links {
				$linksGap: 10px;
				$linksCount: 3;

				display: flex;
				flex-wrap: wrap;
				column-gap: 20px;
				row-gap: 20px;

				.link {
					height: 220px;
					width: calc(
						$platformWidth / $linksCount -
							($linksGap * ($linksCount - 1) / $linksCount)
					);

					border-radius: 10px;
				}
			}
		}
	}
}
</style>
