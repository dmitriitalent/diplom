export const useIosInstallHint = () => {
	const cookie = useCookie<"dismissed" | "">("ios_install_hint", {
		default: () => "",
		maxAge: 60 * 60 * 24 * 30,
		sameSite: "lax",
	});
	const dismissed = computed(() => cookie.value === "dismissed");
	const dismiss = () => (cookie.value = "dismissed");
	return { dismissed, dismiss };
};
