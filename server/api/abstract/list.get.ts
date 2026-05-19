import { decodeAccessToken } from "~~/server/utils/staticfiles";
import {
	listAbstractIds,
	readAbstract,
} from "~~/server/utils/abstracts";
import type { AbstractDtoById } from "~~/server/dto/abstract/byId";
import type { AbstractListDto } from "~~/server/dto/abstract/list";

const FILENAME = "abstract/list.get.ts";

function toDto(
	a: NonNullable<ReturnType<typeof readAbstract>>,
	userId: string | undefined,
): AbstractDtoById {
	return {
		id: a.id,
		type: a.type,
		title: a.title,
		subject: a.subject,
		description: a.description,
		imageIds: a.imageIds,
		authorId: a.authorId,
		likeCount: a.likes.length,
		userLiked: userId ? a.likes.includes(userId) : false,
		createdAt: a.createdAt,
		updatedAt: a.updatedAt,
	};
}

export default defineEventHandler(async (event): Promise<AbstractListDto> => {
	try {
		const cookie = getHeader(event, "cookie");
		const payload = decodeAccessToken(cookie);
		const userId: string | undefined = payload?.sub;

		const query = getQuery(event);
		const search = String(query.search ?? "").trim().toLowerCase();
		const type = String(query.type ?? "");

		const ids = listAbstractIds();
		const items: AbstractDtoById[] = [];
		for (const id of ids) {
			const a = readAbstract(id);
			if (!a) continue;
			if (type === "lecture" || type === "lab") {
				if (a.type !== type) continue;
			}
			if (search && !a.subject.toLowerCase().includes(search)) continue;
			items.push(toDto(a, userId));
		}

		items.sort((x, y) => {
			if (y.likeCount !== x.likeCount) return y.likeCount - x.likeCount;
			return Number(y.id) - Number(x.id);
		});

		return { items };
	} catch (err) {
		const e = err as { statusCode?: number };
		console.log("error at " + FILENAME, err);
		if (e.statusCode) throw err;
		throw createError({ statusCode: 500, message: "Failed to list abstracts" });
	}
});
