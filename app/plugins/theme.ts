export default defineNuxtPlugin(() => {
	const { theme } = useTheme();
	useHead({
		htmlAttrs: {
			"data-theme": theme,
		},
		meta: [
			{
				name: "theme-color",
				content: () =>
					theme.value === "dark" ? "#1a1408" : "#fffaf0",
			},
		],
	});
});
