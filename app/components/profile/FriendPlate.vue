<script setup lang="ts">
import type { ContactLike } from "~/utils/contactUrl";

const props = defineProps<{
	id: string;
	name: string;
	surname: string;
	avatarId: string;
	location?: string;
	contacts?: ContactLike[];
}>();

const emit = defineEmits<{
	delete: [id: string];
}>();

const router = useRouter();

let tooltipTimer: ReturnType<typeof setTimeout> | null = null;
const tooltipVisible = ref(false);

const showTooltip = () => {
	if (tooltipTimer) clearTimeout(tooltipTimer);
	tooltipVisible.value = true;
};
const hideTooltip = () => {
	tooltipTimer = setTimeout(() => {
		tooltipVisible.value = false;
	}, 150);
};

const goToProfile = () => router.push(`/profile/${props.id}`);

const writeContact = () => {
	const url = getPrimaryContactUrl(props.contacts ?? []);
	if (url) window.open(url, "_blank");
};
</script>

<template>
	<div :class="$style.plate" @click="goToProfile">
		<UiImage
			:class="$style.avatar"
			:src="`/api/images/byGuid?guid=${avatarId}`"
		></UiImage>
		<div :class="$style.info">
			<span :class="$style.name">{{ name }} {{ surname }}</span>
			<span v-if="location" :class="$style.location">{{ location }}</span>
		</div>

		<div
			:class="$style.dotsWrapper"
			@mouseenter="showTooltip"
			@mouseleave="hideTooltip"
			@click.stop
		>
			<UiButton :class="$style.dotsBtn" size="custom" inset>
				<Icon name="mdi:dots-horizontal" :class="$style.dotsIcon" />
			</UiButton>

			<div
				v-if="tooltipVisible"
				:class="$style.tooltip"
				@mouseenter="showTooltip"
				@mouseleave="hideTooltip"
			>
				<UiButton :class="$style.tooltipBtn" inset @click="goToProfile">
					Перейти
				</UiButton>
				<UiButton
					:class="[
						$style.tooltipBtn,
						!getPrimaryContactUrl(contacts ?? []) &&
							$style.tooltipBtnDisabled,
					]"
					inset
					:disabled="!getPrimaryContactUrl(contacts ?? [])"
					@click="writeContact"
				>
					Написать
				</UiButton>
				<UiButton
					:class="[$style.tooltipBtn, $style.tooltipBtnDelete]"
					@click="emit('delete', id)"
				>
					Удалить из друзей
				</UiButton>
			</div>
		</div>
	</div>
</template>

<style module lang="scss">
.plate {
	display: flex;
	align-items: center;
	column-gap: 10px;
	padding: 14px 16px;
	border-radius: 10px;
	cursor: pointer;
	transition: background-color $transition-fast;

	&:hover {
		@include color-black-bg(0.06);
	}

	.avatar {
		height: 50px;
		width: 50px;
		aspect-ratio: 1;
		border-radius: 10px;
		overflow: hidden;
	}

	.info {
		display: flex;
		flex-direction: column;
		row-gap: 4px;

		.name {
			@include title-s;
			@include color-black;
		}

		.location {
			@include text-s;
			@include color-black;

			opacity: 0.55;
		}
	}

	.dotsWrapper {
		position: relative;
		flex-shrink: 0;
		margin-left: auto;

		.dotsBtn {
			padding: 4px;
		}

		.dotsIcon {
			width: 20px;
			height: 20px;
		}

		.tooltip {
			position: absolute;
			right: 0;
			top: calc(100% + 4px);
			background: #fff;
			border: 1px solid rgba(0, 0, 0, 0.08);
			border-radius: 8px;
			box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
			display: flex;
			flex-direction: column;
			padding: 4px;
			z-index: 100;
			min-width: 160px;

			.tooltipBtn {
				@include text-m;
				@include color-black;

				box-sizing: border-box;
				justify-content: flex-start;
				padding: 8px 12px;
				border-radius: 6px;
				white-space: nowrap;
				width: 100%;
			}

			.tooltipBtnDisabled {
				opacity: 0.35;
				cursor: default;
			}

			.tooltipBtnDelete {
				@include color-error-bg;
			}
		}
	}
}
</style>
