<script setup lang="ts"></script>

<template>
	<div>
		<NuxtLayout>
			<NuxtPage></NuxtPage>
		</NuxtLayout>
	</div>
</template>

<style lang="scss">
body {
	@include color-white-bg;

	margin: 0;
	padding: 0;
}

a {
	text-decoration: none;
}

.div {
	box-sizing: border-box;
}
</style>
