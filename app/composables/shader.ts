const SHADER_COOKIE = "shader";

export const useShader = () => {
	const cookie = useCookie<"on" | "off">(SHADER_COOKIE, {
		default: () => "on",
		maxAge: 60 * 60 * 24 * 365,
		sameSite: "lax",
	});

	const enabled = computed({
		get: () => cookie.value !== "off",
		set: (v: boolean) => {
			cookie.value = v ? "on" : "off";
		},
	});

	const toggle = () => {
		enabled.value = !enabled.value;
	};

	return { enabled, toggle };
};
