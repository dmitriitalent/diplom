export const BOOKMARKS_MAX_PER_CATEGORY = 10;

export type BookmarkCategory = "product" | "service" | "activity";

export const useBookmarks = (category: BookmarkCategory) => {
	const cookie = useCookie<string[]>(`bookmarks_${category}`, {
		default: () => [],
		maxAge: 60 * 60 * 24 * 365,
		sameSite: "lax",
	});

	const ids = computed<string[]>(() => cookie.value ?? []);

	const isBookmarked = (id: string) => ids.value.includes(id);

	const add = (id: string): boolean => {
		const list = ids.value;
		if (list.includes(id)) return true;
		if (list.length >= BOOKMARKS_MAX_PER_CATEGORY) return false;
		cookie.value = [...list, id];
		return true;
	};

	const remove = (id: string) => {
		cookie.value = ids.value.filter((x) => x !== id);
	};

	const toggle = (id: string): boolean => {
		if (isBookmarked(id)) {
			remove(id);
			return true;
		}
		return add(id);
	};

	return {
		ids,
		isBookmarked,
		add,
		remove,
		toggle,
		max: BOOKMARKS_MAX_PER_CATEGORY,
	};
};
