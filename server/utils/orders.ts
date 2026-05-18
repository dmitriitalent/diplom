import fs from "node:fs";
import path from "node:path";
import { STATICFILES_DIR, ensureStaticfilesDir, decodeAccessToken } from "./staticfiles";

export const ORDERS_DIR = path.join(STATICFILES_DIR, "orders");

export type OrderFile = {
	id: string;
	type: string;
	description: string;
	imageIds: Array<string>;
	authorId: string;
	createdAt: string;
	updatedAt: string;
	closedAt: string | null;
	closeType: "completed" | "declined" | null;
	closeComment: string;
	status: "open" | "closed";
};

export function ensureOrdersDir() {
	ensureStaticfilesDir();
	if (!fs.existsSync(ORDERS_DIR)) {
		fs.mkdirSync(ORDERS_DIR, { recursive: true });
	}
}

export function listOrderIds(): number[] {
	ensureOrdersDir();
	return fs
		.readdirSync(ORDERS_DIR)
		.filter((f) => f.endsWith(".json"))
		.map((f) => parseInt(f.slice(0, -5), 10))
		.filter((n) => Number.isFinite(n))
		.sort((a, b) => a - b);
}

export function readOrder(id: number | string): OrderFile | null {
	ensureOrdersDir();
	const fp = path.join(ORDERS_DIR, `${id}.json`);
	if (!fs.existsSync(fp)) return null;
	try {
		return JSON.parse(fs.readFileSync(fp, "utf-8")) as OrderFile;
	} catch {
		return null;
	}
}

export function writeOrder(id: number | string, data: OrderFile): void {
	ensureOrdersDir();
	fs.writeFileSync(
		path.join(ORDERS_DIR, `${id}.json`),
		JSON.stringify(data, null, 2),
		"utf-8",
	);
}

export function deleteOrderFile(id: number | string): boolean {
	ensureOrdersDir();
	const fp = path.join(ORDERS_DIR, `${id}.json`);
	if (!fs.existsSync(fp)) return false;
	fs.unlinkSync(fp);
	return true;
}

export function nextOrderId(): number {
	const ids = listOrderIds();
	if (ids.length === 0) return 1;
	const last = ids[ids.length - 1] ?? 0;
	return last + 1;
}

export function isCommandant(cookie: string | undefined): boolean {
	const payload = decodeAccessToken(cookie);
	if (!payload || !Array.isArray(payload.roles)) return false;
	return payload.roles.includes("COMMANDANT") || payload.roles.includes("ADMIN");
}

export function getUserId(cookie: string | undefined): string | null {
	const payload = decodeAccessToken(cookie);
	return payload?.sub ?? null;
}
