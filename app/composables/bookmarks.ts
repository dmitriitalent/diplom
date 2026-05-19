export type BookmarkCategory =
	| "product"
	| "service"
	| "activity"
	| "abstract";

export const BOOKMARKS_MAX: Record<BookmarkCategory, number> = {
	product: 10,
	service: 10,
	activity: 10,
	abstract: 20,
};

export const BOOKMARKS_MAX_PER_CATEGORY = 10;

export const useBookmarks = (category: BookmarkCategory) => {
	const cookie = useCookie<string[]>(`bookmarks_${category}`, {
		default: () => [],
		maxAge: 60 * 60 * 24 * 365,
		sameSite: "lax",
	});

	const max = BOOKMARKS_MAX[category];

	const ids = computed<string[]>(() => cookie.value ?? []);

	const isBookmarked = (id: string) => ids.value.includes(id);

	const add = (id: string): boolean => {
		const list = ids.value;
		if (list.includes(id)) return true;
		if (list.length >= max) return false;
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
		max,
	};
};
