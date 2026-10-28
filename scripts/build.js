import fs from "fs";
import path from "path";

const root = process.cwd();
const readRootFile = relPath =>
	fs.readFileSync(path.join(root, relPath), "utf-8");

function getTagBoundaries(html, keyword, isScript = false) {
	const keyIdx = html.indexOf(keyword);
	if (keyIdx === -1) return null;

	const startIdx = html.lastIndexOf("<", keyIdx);
	let endIdx = html.indexOf(">", keyIdx);

	if (isScript) {
		const closeTag = "</script>";
		const nextFragment = html.slice(endIdx + 1, endIdx + 1 + closeTag.length);
		if (nextFragment.toLowerCase() === closeTag) {
			endIdx += closeTag.length;
		}
	}

	return startIdx === -1 || endIdx === -1
		? null
		: { start: startIdx, end: endIdx + 1 };
}

function inlineAssets(html, keyword, replacement, isScript = false) {
	const bounds = getTagBoundaries(html, keyword, isScript);
	if (!bounds) throw new Error(`Не удалось найти тег по маркеру: ${keyword}`);
	return html.slice(0, bounds.start) + replacement + html.slice(bounds.end);
}

function generateCacheScript(spheresHtml, legendHtml) {
	return [
		"if (!window.BaseHtmlLoader) window.BaseHtmlLoader = { cache: {} };",
		`window.BaseHtmlLoader.cache["./html/spheres.html"] = \`${spheresHtml}\`;`,
		`window.BaseHtmlLoader.cache["./html/legend.html"] = \`${legendHtml}\`;`,
	].join("\n");
}

function generateFontScript(fontPath) {
	if (!fs.existsSync(fontPath)) return "";
	const fontBase64 = fs
		.readFileSync(fontPath)
		.toString("base64")
		.replace(/\s/g, "");
	return `
	(async () => {
		try {
			const font = new FontFace("Geologica", "url(data:font/truetype;base64,${fontBase64})", { display: "swap", weight: "100 900" });
			await font.load();
			document.fonts.add(font);
		} catch (e) { console.error("Ошибка активации шрифта:", e); }
	})();`;
}

try {
	const indexHtml = readRootFile("index.html");
	const loaderJs = readRootFile("js/loader.js");
	const coreJs = readRootFile("js/core.js");
	const scriptJs = readRootFile("js/script.js");

	const spheresHtml = readRootFile("html/spheres.html").replace(
		/\r?\n|\r/g,
		" ",
	);
	const legendHtml = readRootFile("html/legend.html").replace(/\r?\n|\r/g, " ");

	const cssDir = path.join(root, "css");
	const cssFiles = fs.readdirSync(cssDir);

	let rootCss = "";
	let baseCss = "";
	const componentsCss = [];

	cssFiles.forEach(file => {
		if (!file.endsWith(".css") || file === "style.css") return;

		let fileContent = fs.readFileSync(path.join(cssDir, file), "utf-8");

		if (file === "root.css") {
			const lines = fileContent.split("\n");
			let inFontFace = false;
			const cleanLines = lines.filter(line => {
				if (line.includes("@font-face")) {
					inFontFace = true;
					return false;
				}
				if (inFontFace) {
					if (line.includes("}")) inFontFace = false;
					return false;
				}
				return true;
			});
			rootCss = cleanLines.join("\n");
		} else if (file === "base.css") {
			baseCss = fileContent;
		} else {
			componentsCss.push(fileContent);
		}
	});

	let processedHtml = indexHtml;
	const logoPath = path.join(root, "assets/logo.svg");
	if (fs.existsSync(logoPath) && processedHtml.includes("assets/logo.svg")) {
		const logoBase64 = fs.readFileSync(logoPath).toString("base64");
		processedHtml = processedHtml.replace(
			"assets/logo.svg",
			`data:image/svg+xml;base64,${logoBase64}`,
		);
	}

	const combinedCss = [
		"@layer common, components;",
		`@layer common {\n${rootCss}\n${baseCss}\n}`,
		`@layer components {\n${componentsCss.join("\n")}\n}`,
	].join("\n");

	const cleanScriptJs = scriptJs
		.split("\n")
		.filter(line => !line.trim().startsWith("import"))
		.join("\n");

	const cacheInjection = generateCacheScript(spheresHtml, legendHtml);
	const fontInjection = generateFontScript(
		path.join(root, "assets/Geologica.ttf"),
	);

	const combinedScript = [
		'<script type="module">',
		cacheInjection,
		fontInjection,
		loaderJs,
		coreJs,
		cleanScriptJs,
		"</script>",
	].join("\n");

	let finalHtml = inlineAssets(
		processedHtml,
		"css/style.css",
		`<style>\n${combinedCss}\n</style>`,
		false,
	);
	finalHtml = inlineAssets(finalHtml, "js/script.js", combinedScript, true);

	fs.writeFileSync(path.join(root, "dist.html"), finalHtml);
	console.log("🎉 Сборка завершена успешно!");
} catch (error) {
	console.error("❌ Ошибка сборки:", error.message);
}
