<script setup lang="ts">
import type { UserDto } from "~/dto/user.dto";
import type { User } from "~/entities/User";

const router = useRouter();

const { data: user } = useAsyncData<User>(async (_nuxtApp, { signal }) => {
	return $fetch("/api/user/byId?id=1", { signal });
});
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.container">
			<template v-if="user">
				<ProfileCardComponent
					v-for="friend in user.friends"
					:user="friend"
					:class="$style.card"
				></ProfileCardComponent>
			</template>
		</div>
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;
	}

	.card {
		width: 300px;
	}
}
</style>
