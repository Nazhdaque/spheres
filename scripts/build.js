import fs from "fs";
import path from "path";

class HtmlBundler {
	static CONFIG = {
		paths: {
			indexHtml: "index.html",
			outputHtml: "dist.html",
			cssDir: "css",
			font: "assets/Geologica.ttf",
			logo: "assets/x-ru-200-w-2.svg",
			dataPath: "data.tsv",
			colorJs: "js/color.js",
			parserJs: "js/parser.js",
			rendererJs: "js/renderer.js",
			lumenJs: "js/lumen.js",
			coreJs: "js/core.js",
			navJs: "js/nav.js",
			scriptJs: "js/script.js",
		},
		markers: {
			css: "css/style.css",
			js: "js/script.js",
			logo: "./assets/x-ru-200-w-2.svg",
		},
		mime: {
			svg: "data:image/svg+xml;base64,",
			ttf: "data:font/truetype;base64,",
		},
	};

	constructor() {
		this.root = process.cwd();
	}

	readRootFile = relPath => {
		return fs.readFileSync(path.join(this.root, relPath), "utf-8");
	};

	getTagBoundaries = (html, keyword, isScript = false) => {
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
	};

	inlineAssets = (html, keyword, replacement, isScript = false) => {
		const bounds = this.getTagBoundaries(html, keyword, isScript);
		if (!bounds) throw new Error(`Не удалось найти тег по маркеру: ${keyword}`);
		return html.slice(0, bounds.start) + replacement + html.slice(bounds.end);
	};

	cleanModule = (fileText, classNameToGlobal) => {
		let result = fileText
			.split("\n")
			.filter(line => !line.trim().startsWith("import"))
			.join("\n");

		if (classNameToGlobal) {
			result = result.replace(
				`export class ${classNameToGlobal}`,
				`class ${classNameToGlobal}`,
			);
			result = result.replace(
				`export default class ${classNameToGlobal}`,
				`class ${classNameToGlobal}`,
			);
		}
		return result.trim();
	};

	generateFontScript = fontPath => {
		const fullPath = path.join(this.root, fontPath);
		if (!fs.existsSync(fullPath)) return "";

		const fontBase64 = fs
			.readFileSync(fullPath)
			.toString("base64")
			.replace(/\s/g, "");
		const mime = HtmlBundler.CONFIG.mime.ttf;

		return `
		(async () => {
			try {
				const font = new FontFace("Geologica", "url(${mime}${fontBase64})", { display: "swap", weight: "100 900" });
				await font.load();
				document.fonts.add(font);
			} catch (e) { console.error("Ошибка активации шрифта:", e); }
		})();`;
	};

	processCss = () => {
		const paths = HtmlBundler.CONFIG.paths;
		const cssDir = path.join(this.root, paths.cssDir);
		const cssFiles = fs.readdirSync(cssDir);

		let rootCss = "";
		let baseCss = "";
		const componentsCss = [];

		cssFiles.forEach(file => {
			if (!file.endsWith(".css") || file === "style.css") return;

			const fileContent = fs.readFileSync(path.join(cssDir, file), "utf-8");

			if (file === "root.css") {
				rootCss = fileContent;
			} else if (file === "base.css") {
				baseCss = fileContent;
			} else {
				componentsCss.push(fileContent);
			}
		});

		return [
			"@layer common, components;",
			`@layer common {\n${rootCss}\n${baseCss}\n}`,
			`@layer components {\n${componentsCss.join("\n")}\n}`,
		].join("\n");
	};

	processHtmlLogo = indexHtml => {
		const config = HtmlBundler.CONFIG;
		const logoPath = path.join(this.root, config.paths.logo);
		const targetMarker = config.markers.logo;

		if (fs.existsSync(logoPath) && indexHtml.includes(targetMarker)) {
			const logoBase64 = fs.readFileSync(logoPath).toString("base64");
			return indexHtml.replace(targetMarker, `${config.mime.svg}${logoBase64}`);
		}
		return indexHtml;
	};

	processJs = () => {
		const paths = HtmlBundler.CONFIG.paths;

		const colorJs = this.readRootFile(paths.colorJs);
		const parserJs = this.readRootFile(paths.parserJs);
		const rendererJs = this.readRootFile(paths.rendererJs);
		const lumenJs = this.readRootFile(paths.lumenJs);
		const coreJs = this.readRootFile(paths.coreJs);
		const navJs = this.readRootFile(paths.navJs);
		const scriptJs = this.readRootFile(paths.scriptJs);
		const tsvData = this.readRootFile(paths.dataPath);

		const cleanColor = this.cleanModule(colorJs, "ColorConverter");
		const cleanParser = this.cleanModule(parserJs, "DataParser");
		const cleanRenderer = this.cleanModule(rendererJs, "DomRenderer");
		const cleanLumen = this.cleanModule(lumenJs, "Lumen");
		const cleanCore = this.cleanModule(coreJs, "ScaleManager");

		let cleanNav = this.cleanModule(navJs);
		cleanNav = cleanNav.replace(
			"export const initAccessibility",
			"const initAccessibility",
		);

		let cleanScript = this.cleanModule(scriptJs);

		const escapedTsv = tsvData
			.replace(/\\/g, "\\\\")
			.replace(/`/g, "\\`")
			.replace(/\$/g, "\\$");
		const tsvInjection = `const embeddedTsvData = \`${escapedTsv}\`;`;

		const fetchRegex =
			/const\s+response\s*=\s*await\s+fetch\([^)]+\);[\s\S]*?const\s+tsvText\s*=\s*await\s+response\.text\(\);/;
		if (cleanScript.search(fetchRegex) !== -1) {
			cleanScript = cleanScript.replace(
				fetchRegex,
				"const tsvText = embeddedTsvData;",
			);
		} else {
			throw new Error("Не удалось найти и заменить блок fetch в script.js");
		}

		const fontInjection = this.generateFontScript(paths.font);

		return [
			'<script type="module">',
			tsvInjection,
			fontInjection,
			cleanColor,
			cleanParser,
			cleanRenderer,
			cleanLumen,
			cleanCore,
			cleanNav,
			cleanScript,
			"</script>",
		].join("\n");
	};

	compile = () => {
		try {
			const config = HtmlBundler.CONFIG;

			const indexHtml = this.readRootFile(config.paths.indexHtml);
			const processedHtml = this.processHtmlLogo(indexHtml);
			let combinedCss = this.processCss();
			const combinedScript = this.processJs();

			combinedCss = combinedCss.replace(/@font-face\s*\{[^]*?\}/gi, "");

			let finalHtml = this.inlineAssets(
				processedHtml,
				config.markers.css,
				`<style>\n${combinedCss}\n</style>`,
				false,
			);

			finalHtml = this.inlineAssets(
				finalHtml,
				config.markers.js,
				combinedScript,
				true,
			);

			fs.writeFileSync(
				path.join(this.root, config.paths.outputHtml),
				finalHtml,
			);
			console.log(
				"🎉 Сборка завершена успешно! Проект инкапсулирован в dist.html.",
			);
		} catch (error) {
			console.error("❌ Ошибка сборки:", error.message);
		}
	};
}

const bundler = new HtmlBundler();
bundler.compile();
