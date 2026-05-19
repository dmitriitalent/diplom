export type GalleryItemDto = {
	id: string;
	url: string;
	width: number;
	height: number;
	uploadedBy: string;
	uploadedAt: string;
};

export type GalleryListDto = {
	items: Array<GalleryItemDto>;
};
