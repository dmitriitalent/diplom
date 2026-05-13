// Cookie с решением пользователя по плашке «не верифицирован».
//   undefined → плашка показывается
//   "later"   → скрыта (12 часов)
//   "never"   → скрыта (1 год)
export type VerifyWarningStatus = "later" | "never";

const COOKIE = "verify_warning";
const LATER_MAX_AGE = 60 * 60 * 12;
const NEVER_MAX_AGE = 60 * 60 * 24 * 365;

export const useVerifyWarning = () => {
	const cookie = useCookie<VerifyWarningStatus | "">(COOKIE, {
		default: () => "",
		sameSite: "lax",
	});

	const isDismissed = computed(() => cookie.value === "later" || cookie.value === "never");

	const dismissLater = () => {
		const c = useCookie<VerifyWarningStatus>(COOKIE, {
			maxAge: LATER_MAX_AGE,
			sameSite: "lax",
		});
		c.value = "later";
	};

	const dismissForever = () => {
		const c = useCookie<VerifyWarningStatus>(COOKIE, {
			maxAge: NEVER_MAX_AGE,
			sameSite: "lax",
		});
		c.value = "never";
	};

	return { isDismissed, dismissLater, dismissForever };
};
