<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useAuthStore } from "~/stores/authStore";

const { userId } = storeToRefs(useAuthStore());

onMounted(() => {
	navigateTo(
		userId.value ? `/profile/${userId.value}` : "/",
		{ replace: true },
	);
});
</script>

<template>
	<div />
</template>
