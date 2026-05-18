export type OrderDtoClose = {
	closeType: "completed" | "declined";
	closeComment: string;
};
