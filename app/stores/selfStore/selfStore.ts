import type { Self } from "~/entities/Self";
import { useAuthStore } from "../authStore";
import type { AddFriendDto } from "~/dto/addFriend.dto";
import type { byId } from "~~/server/dto/profile/byId";
import type { DormitoryDtoGetById } from "~~/server/dto/dormitory/byId";

export const useSelfStore = defineStore("selfStore", () => {
	const self: Ref<Self | null> = ref(null);

	const { at } = useAuthStore();

	const refreshSelf = async () => {
		if (at != null) {
			return await $fetch<byId>("/api/self/self", {
				headers: useRequestHeaders(["cookie"]),
			})
				.then(async (res) => {
					self.value = await fillSelf(res);
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

	const fillSelf = async (byIdDto: byId): Promise<Self> => {
		const dormitory = await $fetch<DormitoryDtoGetById>(
			"/api/dormitory/byId?id=" + byIdDto.dormitoryId,
			{
				headers: useRequestHeaders(["cookie"]),
			},
		);

		const newSelf: Self = {
			birthdate: {
				value: new Date(byIdDto.birthdate.value),
				visibility: byIdDto.birthdate.visibility,
			},
			building: byIdDto.building,
			contacts: byIdDto.contacts ?? [],
			dormitory: dormitory,
			educationEmail: byIdDto.educationEmail,
			floor: byIdDto.floor,
			friends: byIdDto.friends,
			id: byIdDto.id,
			login: byIdDto.login,
			name: byIdDto.name,
			patronymic: byIdDto.patronymic,
			room: byIdDto.room,
			surname: byIdDto.surname,
		} as Self;

		return newSelf;
	};

	return {
		self,
		refreshSelf,
		addFriend,
		updateSelf,
	};
});
