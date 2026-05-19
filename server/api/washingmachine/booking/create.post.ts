import axios from "axios";
import type { WashingMachineDto } from "~~/server/dto/washingmachine/index";

const FILENAME = "washingmachine/booking/create.post.ts";

function todayYMD(): string {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

function overlaps(
	aFrom: number,
	aTill: number,
	bFrom: number,
	bTill: number,
): boolean {
	return aFrom < bTill && bFrom < aTill;
}

function formatMinutes(m: number): string {
	const h = Math.floor(m / 60);
	const min = m % 60;
	return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig();
		const cookie = getHeader(event, "cookie");
		const { machineId } = getQuery(event);
		const body = await readBody<{
			fromMinutes?: number;
			tillMinutes?: number;
			bookingDate?: string;
		}>(event);

		const fromMinutes = Number(body?.fromMinutes);
		const tillMinutes = Number(body?.tillMinutes);
		if (
			!Number.isFinite(fromMinutes) ||
			!Number.isFinite(tillMinutes) ||
			fromMinutes < 0 ||
			tillMinutes <= fromMinutes ||
			tillMinutes > 24 * 60
		) {
			throw createError({
				statusCode: 400,
				message: "Некорректный интервал бронирования",
			});
		}

		const machineIdStr = String(machineId ?? "");
		if (!machineIdStr) {
			throw createError({
				statusCode: 400,
				message: "machineId is required",
			});
		}

		const targetDate = (body?.bookingDate ?? todayYMD()).trim();

		const listRes = await axios.get<WashingMachineDto[]>(
			`${config.api}/schedule/washingmachine`,
			{ headers: { cookie }, withCredentials: true },
		);

		const machine = (listRes.data ?? []).find(
			(m) => m.id === machineIdStr,
		);
		if (!machine) {
			throw createError({
				statusCode: 404,
				message: "Стиральная машина не найдена",
			});
		}

		const conflict = (machine.bookings ?? []).find(
			(b) =>
				(b.bookingDate ?? "").trim() === targetDate &&
				overlaps(
					fromMinutes,
					tillMinutes,
					b.fromMinutes,
					b.tillMinutes,
				),
		);

		if (conflict) {
			throw createError({
				statusCode: 409,
				message: `Время пересекается с занятой записью ${formatMinutes(
					conflict.fromMinutes,
				)}–${formatMinutes(conflict.tillMinutes)}`,
			});
		}

		const res = await axios.post(
			`${config.api}/schedule/washingmachine/${machineIdStr}/booking`,
			body,
			{ headers: { cookie }, withCredentials: true },
		);

		return res.data;
	} catch (err: any) {
		console.log("error at " + FILENAME, err?.response?.status);
		if (err?.statusCode) throw err;
		throw createError({
			statusCode: err?.response?.status || 500,
			message:
				err?.response?.data?.error ??
				err?.response?.data?.message ??
				String(err),
		});
	}
});
