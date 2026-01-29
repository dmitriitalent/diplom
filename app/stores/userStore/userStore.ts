import type { User } from "~/entities/User";
import { useAuthStore } from "../authStore";
import type { GetSelfDto } from "./getSelf.dto";

export const useUserStore = defineStore("userStore", () => {
	const user: Ref<User | null> = ref(null);

	const { at } = useAuthStore();

	const refreshUser = async () => {
		if (at != null) {
			return await $fetch<GetSelfDto>("/api/user/self", {
				headers: useRequestHeaders(["cookie"]),
			}).then((res) => {
				user.value = res;
			});
		}
	};

	return { user, refreshUser };
});
