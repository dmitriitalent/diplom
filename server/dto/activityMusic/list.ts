export type TrackDto = {
	id: string;
	title: string;
	author: string;
	link: string;
	cover: string;
	addedBy: string;
	addedAt: string;
};

export type MusicListDto = {
	tracks: Array<TrackDto>;
};
