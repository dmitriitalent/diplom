export type TimelineSession<T = unknown> = {
	startAt: number;
	endAt: number;
	color: string;
	isOverlapper?: boolean;

	content: T;
};

export type Session = {
	id: number;
	startAt: number;
	endAt: number;
	description: string;

	process: Process;
};

export type Process = {
	id: number;
	name: string;
	description: string;
	color: string;
};
