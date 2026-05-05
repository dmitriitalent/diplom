export type ContactLike = {
	key: string;
	value: string;
	isPrimary?: boolean;
};

export const buildContactUrl = (key: string, value: string): string | null => {
	const k = key.toLowerCase().trim();
	const v = value.trim();
	if (!v) return null;

	if (v.startsWith("http://") || v.startsWith("https://")) return v;

	if (["phone", "телефон", "тел", "моб", "mobile"].some((s) => k.includes(s)))
		return `tel:${v}`;

	if (["email", "почта", "mail", "e-mail"].some((s) => k.includes(s)))
		return `mailto:${v}`;

	if (["telegram", "tg", "телеграм"].some((s) => k.includes(s))) {
		const handle = v.startsWith("@") ? v.slice(1) : v;
		return `https://t.me/${handle}`;
	}

	if (["whatsapp", "вацап", "wa"].some((s) => k.includes(s))) {
		const num = v.replace(/\D/g, "");
		return `https://wa.me/${num}`;
	}

	if (["vk", "вк", "вконтакте"].some((s) => k.includes(s))) {
		const handle = v.startsWith("@") ? v.slice(1) : v;
		return `https://vk.com/${handle}`;
	}

	if (["instagram", "ig", "инстаграм"].some((s) => k.includes(s))) {
		const handle = v.startsWith("@") ? v.slice(1) : v;
		return `https://www.instagram.com/${handle}/`;
	}

	if (["viber", "вайбер"].some((s) => k.includes(s))) {
		const num = v.replace(/\D/g, "");
		return `viber://chat?number=%2B${num}`;
	}

	return v;
};

export const getPrimaryContact = (contacts: ContactLike[]): ContactLike | null =>
	contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null;

export const getPrimaryContactUrl = (contacts: ContactLike[]): string | null => {
	const c = getPrimaryContact(contacts);
	return c ? buildContactUrl(c.key, c.value) : null;
};

export const contactIcon = (key: string): string => {
	const k = key.toLowerCase();
	if (["telegram", "tg", "телеграм"].some((s) => k.includes(s)))
		return "mdi:telegram";
	if (["whatsapp", "wa"].some((s) => k.includes(s)))
		return "ic:baseline-whatsapp";
	if (["vk", "вк"].some((s) => k.includes(s))) return "mdi:vk";
	if (["instagram", "ig"].some((s) => k.includes(s))) return "mdi:instagram";
	if (["phone", "тел", "моб"].some((s) => k.includes(s))) return "mdi:phone";
	if (["email", "mail", "почта"].some((s) => k.includes(s))) return "mdi:email";
	if (["viber", "вайбер"].some((s) => k.includes(s))) return "mdi:phone-in-talk";
	return "mdi:link-variant";
};
