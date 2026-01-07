type Device = "mobile" | "desktop";

const DEVICES = new Map<Device, number>([
	["desktop", 1440],
	["mobile", 0],
]);

export { type Device, DEVICES };
