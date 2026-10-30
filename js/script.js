import { DataParser } from "./parser.js";
import { DomRenderer } from "./renderer.js";
import { ScaleManager } from "./core.js";
import { initAccessibility } from "./nav.js";
import Lumen from "./lumen.js";

class App {
	static CONFIG = {
		selectors: {
			root: "#app",
			spheres: ".spheres",
			legendContainer: ".legend",
			legendItems: ".legend li",
		},
		classes: {
			pinned: "is-pinned",
			activeSphere: "legend-active",
			activeLegend: "sphere-active",
		},
		viewSettings: {
			legend: {
				"--width": "30",
				// "--zoom": "0.66",
				// "--place": "start",
			},
			legendList: {
				"--col": "3",
				// "--mode": "flex",
			},
			spheres: {
				"--log-scale": "0",
				"--is-reverse": "1",
				"--layer-order": "1",
				"--overlap-ratio": "0.2",
			},
		},
		dataPath: "./data.tsv",
	};

	constructor() {
		this.rootEl = null;
		this.container = null;
		this.legendItems = null;
		this.scaleManager = null;
		this.lumen = null;
	}

	async init() {
		try {
			const config = App.CONFIG;
			this.rootEl = document.querySelector(config.selectors.root);
			if (!this.rootEl) return;

			const response = await fetch(config.dataPath);
			if (!response.ok) throw new Error(`Status: ${response.status}`);
			const tsvText = await response.text();

			const parsedData = DataParser.parseTSV(tsvText);
			const renderResult = DomRenderer.render(
				parsedData,
				this.rootEl,
				config.viewSettings,
			);

			this.container = renderResult.spheresContainer;
			this.legendItems = renderResult.legendItems;

			this.scaleManager = new ScaleManager(this.container, this.legendItems);

			this.lumen = new Lumen(this.container, {
				ease: 0.08,
				limits: { min: 0.05, max: 0.95 },
			});

			this.bindEvents();

			initAccessibility({
				spheres: config.selectors.spheres,
				legend: config.selectors.legendContainer,
			});
		} catch (error) {
			console.error("Initialization error:", error);
		}
	}

	toggleActive(pair, isOver) {
		const classes = App.CONFIG.classes;
		pair.sphere?.classList.toggle(classes.activeSphere, isOver);
		pair.legend?.classList.toggle(classes.activeLegend, isOver);
	}

	togglePinned(pair) {
		const classes = App.CONFIG.classes;
		pair.sphere?.classList.toggle(classes.pinned);
		pair.legend?.classList.toggle(classes.pinned);
	}

	bindEvents() {
		const eventTypes = ["mouseover", "mouseout", "click"];

		eventTypes.forEach(eventType => {
			this.rootEl.addEventListener(eventType, e => {
				const pair = this.scaleManager.getPair(e.target);
				if (!pair) return;

				if (eventType === "click") {
					this.togglePinned(pair);
				} else {
					this.toggleActive(pair, eventType === "mouseover");
				}
			});
		});
	}
}

const app = new App();

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => app.init());
} else {
	app.init();
}
