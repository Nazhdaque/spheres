export class BaseHtmlLoader extends HTMLElement {
	static CONFIG = {
		registry: {
			"bi-spheres": {
				path: "./html/spheres.html",
				event: "spheres-ready",
			},
			"bi-legend": {
				path: "./html/legend.html",
				event: "legend-ready",
			},
		},
		attributes: {
			sourcePath: "from",
		},
		mime: {
			html: "text/html",
		},
	};

	constructor(defaultPath, readyEventName) {
		super();
		this.defaultPath = defaultPath;
		this.readyEventName = readyEventName;
	}

	async connectedCallback() {
		try {
			const config = BaseHtmlLoader.CONFIG;
			const filePath =
				this.getAttribute(config.attributes.sourcePath) || this.defaultPath;
			const htmlText = await this.loadTemplate(filePath);

			this.render(htmlText);
		} catch (error) {
			console.error(error);
		}
	}

	loadTemplate = async filePath => {
		if (window.BaseHtmlLoader?.cache?.[filePath]) {
			return window.BaseHtmlLoader.cache[filePath];
		}

		const response = await fetch(filePath);
		if (!response.ok) throw new Error(`Status: ${response.status}`);
		return await response.text();
	};

	render = htmlText => {
		const config = BaseHtmlLoader.CONFIG;
		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlText, config.mime.html);
		const content = doc.body.firstChild;

		if (content) {
			this.replaceChildren(content);
			this.dispatchEvent(
				new CustomEvent(this.readyEventName, { bubbles: true }),
			);
		}
	};

	static register = () => {
		Object.entries(BaseHtmlLoader.CONFIG.registry).forEach(
			([tagName, settings]) => {
				customElements.define(
					tagName,
					class extends BaseHtmlLoader {
						constructor() {
							super(settings.path, settings.event);
						}
					},
				);
			},
		);
	};
}

BaseHtmlLoader.register();
