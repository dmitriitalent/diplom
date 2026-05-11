import type { Self } from "~/entities/Self";
import { useAuthStore } from "../authStore";
import type { AddFriendDto } from "~/dto/addFriend.dto";
import type { byId } from "~~/server/dto/profile/byId";
import type { DormitoryDtoGetById } from "~~/server/dto/dormitory/byId";
import { jwtDecode, type JwtPayload } from "jwt-decode";

export interface AccessToken extends JwtPayload {
	roles: Array<string>;
}

export const useSelfStore = defineStore("selfStore", () => {
	const self: Ref<Self | null> = ref(null);

	const { at } = useAuthStore();

	const isAdmin = computed(() => {
		if (at) {
			const atobj = jwtDecode(at);
			if ((atobj as AccessToken).roles.includes("ADMIN")) {
				return true;
			}
		}

		return false;
	});

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

	const logout = () => {
		self.value = null;
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

	const updateAvatar = async (imageId: string) => {
		await $fetch("/api/self/avatar", {
			method: "PUT",
			body: { imageId },
		});
		await refreshSelf();
	};

	const deleteAvatar = async () => {
		await $fetch("/api/self/avatar", {
			method: "DELETE",
		});
		await refreshSelf();
	};

	const fillSelf = async (byIdDto: byId): Promise<Self> => {
		const dormitory = await $fetch<DormitoryDtoGetById>(
			"/api/dormitory/byId?id=" + byIdDto.dormitoryId,
			{
				headers: useRequestHeaders(["cookie"]),
			},
		);

		const newSelf: Self = {
			avatarId: byIdDto.avatarId,
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
		isAdmin,
		logout,
		refreshSelf,
		addFriend,
		updateSelf,
		updateAvatar,
		deleteAvatar,
	};
});
