export class BaseHtmlLoader extends HTMLElement {
	constructor(defaultPath, readyEventName) {
		super();
		this.defaultPath = defaultPath;
		this.readyEventName = readyEventName;
	}

	async connectedCallback() {
		try {
			const filePath = this.getAttribute("from") || this.defaultPath;
			let htmlText = "";

			if (window.BaseHtmlLoader?.cache?.[filePath]) {
				htmlText = window.BaseHtmlLoader.cache[filePath];
			} else {
				const response = await fetch(filePath);
				if (!response.ok) throw new Error(`Status: ${response.status}`);
				htmlText = await response.text();
			}

			const parser = new DOMParser();
			const doc = parser.parseFromString(htmlText, "text/html");
			const content = doc.body.firstChild;

			if (content) {
				this.replaceChildren(content);
				this.dispatchEvent(
					new CustomEvent(this.readyEventName, { bubbles: true }),
				);
			}
		} catch (error) {
			console.error(error);
		}
	}
}

customElements.define(
	"bi-spheres",
	class extends BaseHtmlLoader {
		constructor() {
			super("./html/spheres.html", "spheres-ready");
		}
	},
);

customElements.define(
	"bi-legend",
	class extends BaseHtmlLoader {
		constructor() {
			super("./html/legend.html", "legend-ready");
		}
	},
);
