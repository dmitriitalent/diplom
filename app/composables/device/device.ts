import { DEVICES, type Device } from "./types";

function defineDevice() {
	const device: Ref<Device | undefined> = ref(undefined);

	const calcDevice = () => {
		device.value =
			document.documentElement.clientWidth > DEVICES.get("desktop")!
				? "desktop"
				: "mobile";
	};

	return function useDevice() {
		if (device.value === undefined) {
			onMounted(() => {
				calcDevice();
				window.addEventListener("resize", calcDevice);
			});
			onUnmounted(() => {
				window.removeEventListener("resize", calcDevice);
			});
		}

		const deviceClassList = computed(() => {
			return [`--is-${device.value}`];
		});

		const isDevice = (...devices: String[]) => {
			for (let i = 0; i < devices.length; i++) {
				if (devices[i] === device.value) {
					return true;
				}
			}

			return false;
		};

		return { deviceClassList, isDevice, device };
	};
}

export const useDevice = defineDevice();
