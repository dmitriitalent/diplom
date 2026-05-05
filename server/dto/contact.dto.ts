import { SelfDataVisibility } from "./selfDataVisibility.dto";

export type ContactDto = {
	key: string;
	value: string;
	visibility: SelfDataVisibility;
	isPrimary: boolean;
};
