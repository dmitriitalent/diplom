import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const BASE = "https://raw.githubusercontent.com/Roman-/dicts/master";

const FILES = [
	"eng_orange_brainstorm.txt",
	"eng_orange_easy.txt",
	"eng_orange_optimus.txt",
	"eng_thehat_easy.txt",
	"eng_thehat_hard.txt",
	"eng_thehat_normal.txt",
	"rus_custom_15kfun.txt",
	"rus_custom_clearmeanings.txt",
	"rus_orange_brainstorm.txt",
	"rus_orange_easy.txt",
	"rus_orange_optimus.txt",
	"rus_thehat_celebrities.txt",
	"rus_thehat_easy.txt",
	"rus_thehat_hard.txt",
	"rus_thehat_normal.txt",
];

const DEST = path.resolve(
	process.cwd(),
	"staticfiles/games/dicts",
);

const PRETTY = {
	orange_brainstorm: "Orange: мозговой штурм",
	orange_easy: "Orange: лёгкий",
	orange_optimus: "Orange: оптимум",
	thehat_easy: "The Hat: лёгкий",
	thehat_normal: "The Hat: средний",
	thehat_hard: "The Hat: сложный",
	thehat_celebrities: "The Hat: знаменитости",
	custom_15kfun: "15K Fun",
	custom_clearmeanings: "Чёткие значения",
};

function fetchText(url) {
	return new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
					resolve(fetchText(res.headers.location));
					return;
				}
				if (res.statusCode !== 200) {
					reject(new Error(`HTTP ${res.statusCode} for ${url}`));
					return;
				}
				let data = "";
				res.setEncoding("utf8");
				res.on("data", (c) => (data += c));
				res.on("end", () => resolve(data));
			})
			.on("error", reject);
	});
}

function parseFilename(filename) {
	const base = filename.replace(/\.txt$/, "");
	const langCode = base.slice(0, 3);
	const lang = langCode === "rus" ? "ru" : "en";
	const id = base.slice(4);
	return { lang, id };
}

async function main() {
	fs.mkdirSync(path.join(DEST, "ru"), { recursive: true });
	fs.mkdirSync(path.join(DEST, "en"), { recursive: true });

	const manifest = { ru: [], en: [] };

	for (const filename of FILES) {
		const url = `${BASE}/${filename}`;
		console.log(`fetching ${url}`);
		const text = await fetchText(url);
		const words = text
			.split(/\r?\n/)
			.map((s) => s.trim())
			.filter((s) => s.length > 0 && !s.startsWith("#"));
		const { lang, id } = parseFilename(filename);
		const outPath = path.join(DEST, lang, `${id}.json`);
		fs.writeFileSync(outPath, JSON.stringify(words), "utf8");
		const entry = {
			id,
			name: PRETTY[id] ?? id,
			count: words.length,
		};
		manifest[lang].push(entry);
		console.log(`  → ${outPath} (${words.length} words)`);
	}

	manifest.ru.sort((a, b) => a.name.localeCompare(b.name, "ru"));
	manifest.en.sort((a, b) => a.name.localeCompare(b.name, "en"));

	fs.writeFileSync(
		path.join(DEST, "index.json"),
		JSON.stringify(manifest, null, 2),
		"utf8",
	);
	console.log("done");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
