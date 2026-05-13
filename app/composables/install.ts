export const useInstallPrompt = () => {
	const { $pwa } = useNuxtApp() as any;

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

	const canInstall = computed(
		() => !!$pwa?.showInstallPrompt && !isStandalone.value,
	);
	const showIosHint = computed(() => isIos.value && !isStandalone.value);
	const install = () => $pwa?.install();

	return { canInstall, showIosHint, isStandalone, install };
};
