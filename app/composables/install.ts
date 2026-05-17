import { useDevice } from "~/composables/device";

// Глобальный (для приложения) флаг показа подсказки-инструкции
// «как установить вручную». Поднимается при клике по кнопке установки,
// когда системный prompt недоступен.
const manualHintVisible = ref(false);

export const useInstallPrompt = () => {
	const { $pwa } = useNuxtApp() as any;
	const { isDevice } = useDevice();

	const isIos = computed(() => {
		if (!import.meta.client) return false;
		return /iphone|ipad|ipod/i.test(navigator.userAgent);
	});

	const isStandalone = computed(() => {
		if (!import.meta.client) return false;
		return (
			window.matchMedia("(display-mode: standalone)").matches ||
			(navigator as any).standalone === true
		);
	});

	const isMobile = computed(() => isDevice("mobile"));

	// Системный prompt действительно готов.
	const canInstall = computed(
		() => !!$pwa?.showInstallPrompt && !isStandalone.value,
	);

	const showInstallButton = computed(
		() => isMobile.value && !isStandalone.value,
	);

	// Подсказка для iOS — Safari не реализует beforeinstallprompt,
	// единственный путь — «Поделиться → На экран „Домой"».
	const showIosHint = computed(() => isIos.value && !isStandalone.value);

	const install = () => {
		if (canInstall.value) {
			$pwa?.install();
			return;
		}
		// Системного prompt нет — показываем инструкцию вручную.
		manualHintVisible.value = true;
	};

	const dismissManualHint = () => {
		manualHintVisible.value = false;
	};

	return {
		canInstall,
		showInstallButton,
		showIosHint,
		isStandalone,
		isIos,
		install,
		manualHintVisible,
		dismissManualHint,
	};
};
