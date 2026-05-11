<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSelfStore } from "~/stores/selfStore";

const selfStore = useSelfStore();
const { self } = storeToRefs(selfStore);

if (self.value?.id) {
	await navigateTo(`/profile/${self.value.id}`, { replace: true });
} else {
	await navigateTo("/welcome", { replace: true });
}
</script>

<template>
	<div />
</template>
