export type TrackMetadata = {
	title: string;
	author: string;
	image: string;
};

function decodeHtmlEntities(s: string): string {
	return s
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&#39;/g, "'")
		.replace(/&#x2F;/g, "/")
		.replace(/&nbsp;/g, " ")
		.replace(/&#(\d+);/g, (_, n: string) =>
			String.fromCharCode(parseInt(n, 10)),
		);
}

function parseMetaTags(html: string): Record<string, string> {
	const tags: Record<string, string> = {};
	const metaRegex = /<meta\s[^>]*>/gi;
	let match: RegExpExecArray | null;
	while ((match = metaRegex.exec(html)) !== null) {
		const tag = match[0];
		const propMatch = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag);
		const contentMatch = /content\s*=\s*["']([^"']*)["']/i.exec(tag);
		if (propMatch && contentMatch) {
			const key = propMatch[1]!.toLowerCase();
			if (!tags[key]) tags[key] = decodeHtmlEntities(contentMatch[1]!);
		}
	}
	const titleMatch = /<title>([^<]*)<\/title>/i.exec(html);
	if (titleMatch && !tags["title"]) {
		tags["title"] = decodeHtmlEntities(titleMatch[1]!);
	}
	return tags;
}

function splitTitleAuthor(raw: string): { title: string; author: string } {
	const parts = raw.split(/\s+[—–\-−]\s+/);
	if (parts.length >= 2) {
		return {
			title: parts[0]!.trim(),
			author: parts.slice(1).join(" — ").trim(),
		};
	}
	const commaParts = raw.split(/\s*,\s*/);
	if (commaParts.length >= 2) {
		return {
			title: commaParts[0]!.trim(),
			author: commaParts.slice(1).join(", ").trim(),
		};
	}
	return { title: raw.trim(), author: "" };
}

export async function fetchTrackMetadata(url: string): Promise<TrackMetadata> {
	try {
		const html = await $fetch<string>(url, {
			responseType: "text",
			timeout: 6000,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; Hostelite/1.0; +https://hostelite.ru)",
				Accept: "text/html,application/xhtml+xml",
				"Accept-Language": "ru,en;q=0.8",
			},
		});

		const tags = parseMetaTags(html);

		const rawTitle =
			tags["og:title"] ?? tags["twitter:title"] ?? tags["title"] ?? "";
		const image =
			tags["og:image"] ??
			tags["twitter:image"] ??
			tags["twitter:image:src"] ??
			"";
		const description =
			tags["og:description"] ?? tags["twitter:description"] ?? "";

		let { title, author } = splitTitleAuthor(rawTitle);

		if (!author && description) {
			const dashed = splitTitleAuthor(description);
			if (dashed.author) {
				author = dashed.author;
			}
		}

		return { title, author, image };
	} catch {
		return { title: "", author: "", image: "" };
	}
}
