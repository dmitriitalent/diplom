/**
 * Sentinel-дата для пользователей, не указавших дату рождения.
 * Сохраняется в БД и означает «возраст не указан». Использовать только для
 * проверки через `isPlaceholderBirthdate()` — в UI вместо возраста выводить «—».
 */
export const PLACEHOLDER_BIRTHDATE_YEAR = 1900;

/**
 * Проверяет, является ли дата sentinel-плейсхолдером (год 1900 или раньше)
 * либо вообще не задана.
 * @param date — Date, число (unix ms) или строка ISO/локализованная.
 */
export function isPlaceholderBirthdate(
	date: Date | number | string | null | undefined,
): boolean {
	if (date == null) return true;
	const d = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(d.getTime())) return true;
	return d.getFullYear() <= PLACEHOLDER_BIRTHDATE_YEAR;
}

/**
 * Возвращает возраст в годах либо `null`, если дата не указана или является
 * sentinel-плейсхолдером. В местах отображения выводить прочерк при `null`.
 */
export function getAgeFromUnix(
	unixMillis: number | Date | string | null | undefined,
	now: Date = new Date(),
): number | null {
	if (unixMillis == null) return null;
	const birthDate =
		unixMillis instanceof Date ? unixMillis : new Date(unixMillis);
	if (Number.isNaN(birthDate.getTime())) return null;
	if (isPlaceholderBirthdate(birthDate)) return null;

	const todayYear = now.getFullYear();
	const todayMonth = now.getMonth();
	const todayDay = now.getDate();

	const birthYear = birthDate.getFullYear();
	const birthMonth = birthDate.getMonth();
	const birthDay = birthDate.getDate();

	let age = todayYear - birthYear;

	if (
		todayMonth < birthMonth ||
		(todayMonth === birthMonth && todayDay < birthDay)
	) {
		age--;
	}

	return age;
}

/**
 * `true`, если пользователь несовершеннолетний (< 18 лет) или возраст не указан.
 * Используется для логики родительского согласия при регистрации.
 */
export function requiresParentalConsent(
	birthdate: Date | number | string | null | undefined,
): boolean {
	const age = getAgeFromUnix(birthdate);
	if (age === null) return true;
	return age < 18;
}

/**
 * Форматирует возраст для отображения в UI. Если возраст не определён —
 * возвращает прочерк.
 */
export function formatAge(
	birthdate: Date | number | string | null | undefined,
): string {
	const age = getAgeFromUnix(birthdate);
	return age === null ? "—" : String(age);
}
