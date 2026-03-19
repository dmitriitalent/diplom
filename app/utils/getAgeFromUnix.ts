export function getAgeFromUnix(
	unixSeconds: number,
	now: Date = new Date(),
): number {
	const birthDate = new Date(unixSeconds);

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
