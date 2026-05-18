export type ContactLike = {
	key: string;
	value: string;
	isPrimary?: boolean;
};

// ── Определение типа контакта по ключу ─────────────────────────────────────

const VK_KEYS = ["vk", "вк", "вконтакте"];
const MAX_KEYS = ["max", "макс", "max-messenger", "max messenger"];
const TG_KEYS = ["telegram", "tg", "телеграм"];
const WA_KEYS = ["whatsapp", "вацап", "wa"];
const IG_KEYS = ["instagram", "ig", "инстаграм"];
const VIBER_KEYS = ["viber", "вайбер"];
const PHONE_KEYS = ["phone", "телефон", "тел", "моб", "mobile"];
const EMAIL_KEYS = ["email", "почта", "mail", "e-mail"];

const matchesAny = (key: string, keys: string[]): boolean => {
	const k = key.toLowerCase().trim();
	return keys.some((s) => k.includes(s));
};

export const isVkContact = (key: string): boolean => matchesAny(key, VK_KEYS);
export const isMaxContact = (key: string): boolean => matchesAny(key, MAX_KEYS);

// ── Извлечение handle/тега из значения ─────────────────────────────────────

/**
 * Извлекает VK-handle из любого формата:
 *   "@durov"             → "durov"
 *   "durov"              → "durov"
 *   "https://vk.com/durov" → "durov"
 *   "vk.com/id123"       → "id123"
 *   "https://vk.com/durov?w=wall-1_2" → "durov"
 */
export const extractVkHandle = (value: string): string => {
	const v = value.trim();
	if (!v) return "";
	const urlMatch = v.match(/vk\.com\/([^/?#\s]+)/i);
	if (urlMatch) return urlMatch[1] ?? "";
	if (v.startsWith("@")) return v.slice(1);
	return v;
};

/**
 * Извлекает MAX-handle из значения (по аналогии с VK):
 *   "@user"              → "user"
 *   "user"               → "user"
 *   "https://max.ru/user" → "user"
 */
export const extractMaxHandle = (value: string): string => {
	const v = value.trim();
	if (!v) return "";
	const urlMatch = v.match(/max\.ru\/([^/?#\s]+)/i);
	if (urlMatch) return urlMatch[1] ?? "";
	if (v.startsWith("@")) return v.slice(1);
	return v;
};

// ── Построение ссылки и иконки ─────────────────────────────────────────────

export const buildContactUrl = (key: string, value: string): string | null => {
	const v = value.trim();
	if (!v) return null;

	if (v.startsWith("http://") || v.startsWith("https://")) return v;

	if (matchesAny(key, PHONE_KEYS)) return `tel:${v}`;
	if (matchesAny(key, EMAIL_KEYS)) return `mailto:${v}`;

	if (matchesAny(key, TG_KEYS)) {
		const handle = v.startsWith("@") ? v.slice(1) : v;
		return `https://t.me/${handle}`;
	}

	if (matchesAny(key, WA_KEYS)) {
		const num = v.replace(/\D/g, "");
		return `https://wa.me/${num}`;
	}

	if (isVkContact(key)) {
		const handle = extractVkHandle(v);
		return handle ? `https://vk.com/${handle}` : null;
	}

	if (isMaxContact(key)) {
		const handle = extractMaxHandle(v);
		return handle ? `https://max.ru/${handle}` : null;
	}

	if (matchesAny(key, IG_KEYS)) {
		const handle = v.startsWith("@") ? v.slice(1) : v;
		return `https://www.instagram.com/${handle}/`;
	}

	if (matchesAny(key, VIBER_KEYS)) {
		const num = v.replace(/\D/g, "");
		return `viber://chat?number=%2B${num}`;
	}

	return v;
};

export const contactIcon = (key: string): string => {
	if (matchesAny(key, TG_KEYS)) return "mdi:telegram";
	if (matchesAny(key, WA_KEYS)) return "ic:baseline-whatsapp";
	if (isVkContact(key)) return "mdi:vk";
	if (isMaxContact(key)) return "mdi:message-text";
	if (matchesAny(key, IG_KEYS)) return "mdi:instagram";
	if (matchesAny(key, PHONE_KEYS)) return "mdi:phone";
	if (matchesAny(key, EMAIL_KEYS)) return "mdi:email";
	if (matchesAny(key, VIBER_KEYS)) return "mdi:phone-in-talk";
	return "mdi:link-variant";
};

// ── Выбор контакта ─────────────────────────────────────────────────────────

/** Текущая модель: primary либо первый. */
export const getPrimaryContact = (contacts: ContactLike[]): ContactLike | null =>
	contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null;

export const getPrimaryContactUrl = (contacts: ContactLike[]): string | null => {
	const c = getPrimaryContact(contacts);
	return c ? buildContactUrl(c.key, c.value) : null;
};

/**
 * Контакт для точечного сообщения от комендатуры.
 * Приоритет: VK → MAX → primary (либо первый).
 */
export const pickContactForDM = (contacts: ContactLike[]): ContactLike | null => {
	if (!contacts || contacts.length === 0) return null;
	const vk = contacts.find((c) => isVkContact(c.key));
	if (vk) return vk;
	const max = contacts.find((c) => isMaxContact(c.key));
	if (max) return max;
	return getPrimaryContact(contacts);
};

export const pickContactForDMUrl = (
	contacts: ContactLike[],
): string | null => {
	const c = pickContactForDM(contacts);
	return c ? buildContactUrl(c.key, c.value) : null;
};

/**
 * Контакт, который надо автоматически пометить primary, если ни один не помечен.
 * Приоритет: VK → MAX → первый.
 * Возвращает индекс в массиве (или -1).
 */
export const pickAutoPrimaryIndex = (contacts: ContactLike[]): number => {
	if (!contacts || contacts.length === 0) return -1;
	const vkIdx = contacts.findIndex((c) => isVkContact(c.key));
	if (vkIdx !== -1) return vkIdx;
	const maxIdx = contacts.findIndex((c) => isMaxContact(c.key));
	if (maxIdx !== -1) return maxIdx;
	return 0;
};

/**
 * Возвращает массив контактов с гарантированно ровно одним primary.
 * - Если уже есть primary — возвращает как есть.
 * - Если нет — назначает по pickAutoPrimaryIndex.
 */
export const ensureSinglePrimary = <T extends ContactLike>(contacts: T[]): T[] => {
	if (!contacts || contacts.length === 0) return contacts;
	if (contacts.some((c) => c.isPrimary)) return contacts;
	const idx = pickAutoPrimaryIndex(contacts);
	if (idx === -1) return contacts;
	return contacts.map((c, i) => ({ ...c, isPrimary: i === idx }));
};

// ── Генерация упоминаний пользователей для сообщения ───────────────────────

export type MentionFallbackParts = {
	surname: boolean;
	name: boolean;
	patronymic: boolean;
};

export type MentionableUser = {
	surname?: string;
	name?: string;
	patronymic?: string;
	contacts?: ContactLike[];
};

/**
 * Генерирует упоминание пользователя для текста сообщения.
 * - Если у пользователя есть VK-контакт → возвращает "@handle" (для копирования в VK).
 * - Иначе → собирает строку из ФИО по выбранным чекбоксам.
 * - Если в ФИО нет ни одной выбранной/заполненной части — возвращает пустую строку.
 */
export const formatUserMention = (
	user: MentionableUser,
	parts: MentionFallbackParts,
): string => {
	const vk = user.contacts?.find((c) => isVkContact(c.key));
	if (vk) {
		const handle = extractVkHandle(vk.value);
		if (handle) return `@${handle}`;
	}

	const fio: string[] = [];
	if (parts.surname && user.surname) fio.push(user.surname);
	if (parts.name && user.name) fio.push(user.name);
	if (parts.patronymic && user.patronymic) fio.push(user.patronymic);
	return fio.join(" ");
};
