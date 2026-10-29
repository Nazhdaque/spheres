import "./loader.js";
import { ScaleManager } from "./core.js";
import { initAccessibility } from "./nav.js";
import Lumen from "./lumen.js";

class App {
	static CONFIG = {
		selectors: {
			spheres: ".spheres",
			legendItems: ".legend li",
			legendContainer: ".legend",
		},
		events: {
			readySpheres: "spheres-ready",
			readyLegend: "legend-ready",
		},
		classes: {
			pinned: "is-pinned",
			activeSphere: "legend-active",
			activeLegend: "sphere-active",
		},
	};

	constructor() {
		this.container = null;
		this.legendItems = null;
		this.scaleManager = null;
		this.lumen = null;
		this.events = {
			mouseover: pair => this.toggleActive(pair, true),
			mouseout: pair => this.toggleActive(pair, false),
			click: pair => this.togglePinned(pair),
		};
	}

	async init() {
		const selectors = App.CONFIG.selectors;
		const readyEvents = App.CONFIG.events;

		const isSpheresExist = !!document.querySelector(selectors.spheres);
		const isLegendExist = !!document.querySelector(selectors.legendItems);

		if (!isSpheresExist || !isLegendExist) {
			await Promise.all([
				new Promise(resolve =>
					document.addEventListener(readyEvents.readySpheres, resolve, {
						once: true,
					}),
				),
				new Promise(resolve =>
					document.addEventListener(readyEvents.readyLegend, resolve, {
						once: true,
					}),
				),
			]);
		}

		this.container = document.querySelector(selectors.spheres);
		this.legendItems = document.querySelectorAll(selectors.legendItems);

		if (!this.container || !this.legendItems.length) return;

		this.scaleManager = new ScaleManager(this.container, this.legendItems);

		this.lumen = new Lumen(this.container, {
			ease: 0.08,
			limits: { min: 0.05, max: 0.95 },
		});

		this.bindEvents();

		initAccessibility({
			spheres: selectors.spheres,
			legend: selectors.legendContainer,
		});
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
		Object.entries(this.events).forEach(([eventType, handler]) => {
			document.addEventListener(eventType, e => {
				const pair = this.scaleManager.getPair(e.target);
				if (pair) handler(pair);
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
