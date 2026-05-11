export type WashingMachineBooking = {
	bookingDate: string;
	createdAt: string;
	fromMinutes: number;
	id: string;
	tillMinutes: number;
	userId: string;
	washingMachineId: string;
};

export type WashingMachineDto = {
	bookings: WashingMachineBooking[];
	createdAt: string;
	dormitoryId: string;
	id: string;
	location: string;
};
