export interface TemplateDefinition {
	id: number;
	name: string;
	/** Ключ для запроса превью: GET /api/staticfiles/{key} */
	key: string;
}

export const ACTIVITY_TEMPLATES: TemplateDefinition[] = [
	{ id: 0, name: "Классический", key: "activity-0" },
	{ id: 1, name: "Современный", key: "activity-1" },
];

export const NEWS_TEMPLATES: TemplateDefinition[] = [
	{ id: 0, name: "Классический", key: "news-0" },
	{ id: 1, name: "Современный", key: "news-1" },
];

export const PRODUCT_TEMPLATES: TemplateDefinition[] = [
	{ id: 0, name: "Классический", key: "catalog-0" },
	{ id: 1, name: "Современный", key: "catalog-1" },
];

export const SERVICE_TEMPLATES: TemplateDefinition[] = [
	{ id: 0, name: "Классический", key: "service-0" },
	{ id: 1, name: "Современный", key: "service-1" },
];

/** Все ключи из всех групп шаблонов */
export const ALL_TEMPLATE_KEYS = [
	...ACTIVITY_TEMPLATES,
	...NEWS_TEMPLATES,
	...PRODUCT_TEMPLATES,
	...SERVICE_TEMPLATES,
].map((t) => t.key);
