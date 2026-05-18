<script setup lang="ts">
/**
 * Неубираемая плашка-предупреждение: «не указан VK-контакт».
 * Используется на /profile/self и /profile/self/settings.
 *
 * Если задан слот по умолчанию — он используется как обработчик
 * «Добавить VK» (например, в settings.vue открывает форму контакта).
 * Без слота — рендерится `<RouterLink>` в настройки.
 */

defineProps<{
	/** Скрыть/показать кнопку действия. По умолчанию — показывать. */
	showAction?: boolean;
}>();

const emit = defineEmits<{
	(e: "add"): void;
}>();

const onClickAdd = () => emit("add");
</script>

<template>
	<div :class="$style.vkWarning">
		<Icon name="mdi:vk" :class="$style.vkWarningIcon" />
		<div :class="$style.vkWarningBody">
			<div :class="$style.vkWarningTitle">
				Не указан контакт ВКонтакте
			</div>
			<div :class="$style.vkWarningText">
				ВКонтакте&nbsp;— основной канал связи коменданта
				с&nbsp;проживающими. Без него комендант не сможет написать
				вам в&nbsp;личные сообщения.
			</div>

			<!-- Слот для кастомного действия, либо дефолтная ссылка/кнопка. -->
			<slot>
				<button
					v-if="showAction !== false"
					type="button"
					:class="$style.vkWarningBtn"
					@click="onClickAdd"
				>
					<Icon name="mdi:plus" :class="$style.vkWarningBtnIcon" />
					Добавить VK
				</button>
			</slot>
		</div>
	</div>
</template>

<style module lang="scss">
.vkWarning {
	@include color-black;

	display: flex;
	align-items: flex-start;
	column-gap: 12px;
	padding: 14px 16px;
	border-radius: 10px;
	border: 1px solid rgba($color-error-rgb, 0.35);
	background: rgba($color-error-rgb, 0.08);

	.vkWarningIcon {
		width: 28px;
		height: 28px;
		flex-shrink: 0;
		color: #0077ff;
		margin-top: 2px;
	}

	.vkWarningBody {
		display: flex;
		flex-direction: column;
		row-gap: 6px;
		min-width: 0;
	}

	.vkWarningTitle {
		@include text-m;
		@include color-black;

		font-weight: 600;
	}

	.vkWarningText {
		@include text-s;
		@include color-black(0.75);

		line-height: 1.45;
	}

	.vkWarningBtn {
		@include text-s;

		display: inline-flex;
		align-items: center;
		column-gap: 6px;
		align-self: flex-start;
		margin-top: 4px;
		padding: 7px 14px;
		border-radius: 8px;
		border: 1px solid rgba($color-accent-rgb, 0.4);
		background: rgba($color-accent-rgb, 0.1);
		color: $color-accent;
		cursor: pointer;
		font-weight: 600;
		text-decoration: none;
		transition: background 0.15s;

		&:hover {
			background: rgba($color-accent-rgb, 0.2);
		}

		.vkWarningBtnIcon {
			width: 14px;
			height: 14px;
		}
	}
}
</style>
