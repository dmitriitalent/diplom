import { ContactDto } from "../contact.dto";

/** Карточка проживающего для админ-панели коменданта. */
export type ResidentCardDto = {
	id: string;
	avatarId: string;
	surname: string;
	name: string;
	patronymic: string;
	dormitoryId: string;
	building: string;
	floor: string;
	room: string;
	contacts: ContactDto[];
	roles: string[];
};

export type ResidentsListDto = {
	items: ResidentCardDto[];
};
