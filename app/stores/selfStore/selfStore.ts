import type { Self } from "~/entities/Self";
import { useAuthStore } from "../authStore";
import type { SelfDto } from "../../dto/self.dto";
import type { AddFriendDto } from "~/dto/addFriend.dto";

export const useSelfStore = defineStore("selfStore", () => {
	const self: Ref<Self | null> = ref(null);

	const { at } = useAuthStore();

	const refreshSelf = async () => {
		if (at != null) {
			return await $fetch<Self>("/api/self/self", {
				headers: useRequestHeaders(["cookie"]),
			})
				.then((res) => {
					self.value = res;

					// TODO исправить когда Андрей начнет возвращать friends
					self.value.friends = {
						value: [],
						visibility: "EVERYONE",
					};
					// надо просто удалить это по идеe и зайти в settings. Ошибка была undefined.value в onClickSave
				})
				.catch((err) => {
					console.log(err.data);
				});
		}
	};

	const addFriend = async () => {
		if (at != null) {
			return await $fetch<AddFriendDto>("/api/self/addFriend", {
				headers: useRequestHeaders(["cookie"]),
			}).then((res) => {
				console.log(res);
			});
		}
	};

	const updateSelf = async (newSelf: Self) => {
		return $fetch("/api/self/settings/settings", {
			method: "PUT",
			body: newSelf,
		}).then((res) => {
			refreshSelf();
		});
	};

	return {
		self,
		refreshSelf,
		addFriend,
		updateSelf,
	};
});
