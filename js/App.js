import "../css/style.css";
import DataParser from "./DataParser.js";
import DomRenderer from "./DomRenderer.js";
import ScaleManager from "./ScaleManager.js";
import Lumen from "./Lumen.js";
import { initAccessibility } from "./KeyboardNavigation.js";

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
			legend: { "--width": "30" },
			legendList: { "--col": "3" },
			spheres: {
				"--log-scale": "0",
				"--is-reverse": "1",
				"--layer-order": "1",
				"--overlap-ratio": "0.2",
			},
		},
		dataPath: "data-hare.tsv",
	};

	constructor() {
		this.rootEl = null;
		this.container = null;
		this.legendItems = null;
		this.scaleManager = null;
		this.lumen = null;
		this.boundHandlers = new Map();
	}

	async init() {
		try {
			const config = App.CONFIG;
			this.rootEl = document.querySelector(config.selectors.root);
			if (!this.rootEl) return;

			const response = await fetch(config.dataPath);
			if (!response.ok)
				throw new Error(`HTTP Error Status: ${response.status}`);
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
			const handler = e => {
				const pair = this.scaleManager.getPair(e.target);
				if (!pair) return;

				if (eventType === "click") {
					this.togglePinned(pair);
				} else {
					this.toggleActive(pair, eventType === "mouseover");
				}
			};

			this.boundHandlers.set(eventType, handler);
			this.rootEl.addEventListener(eventType, handler);
		});
	}

	destroy() {
		if (this.rootEl && this.boundHandlers.size > 0) {
			this.boundHandlers.forEach((handler, eventType) => {
				this.rootEl.removeEventListener(eventType, handler);
			});
		}
		if (this.lumen) {
			this.lumen.destroy();
		}
		this.boundHandlers.clear();
	}
}

const app = new App();
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => app.init());
} else {
	app.init();
}
