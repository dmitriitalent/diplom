export type Theme = "light" | "dark";

const THEME_COOKIE = "theme";

const applyTheme = (theme: Theme) => {
	if (import.meta.client) {
		document.documentElement.setAttribute("data-theme", theme);
	}
};

export const useTheme = () => {
	const cookie = useCookie<Theme>(THEME_COOKIE, {
		default: () => "light",
		maxAge: 60 * 60 * 24 * 365,
		sameSite: "lax",
	});

	const theme = computed<Theme>(() => cookie.value ?? "light");
	const isDark = computed(() => theme.value === "dark");

	const setTheme = (next: Theme) => {
		cookie.value = next;
		applyTheme(next);
	};

	const toggle = () => setTheme(isDark.value ? "light" : "dark");

	// Apply on every mount/setup call so SSR-rendered <html> stays in sync.
	if (import.meta.client) applyTheme(theme.value);

	return { theme, isDark, setTheme, toggle };
};
