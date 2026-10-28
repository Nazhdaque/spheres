import "./loader.js";
import { calculateScale, buildElementMap } from "./core.js";

async function initApp() {
	const isSpheresExist = !!document.querySelector(".spheres");
	const isLegendExist = !!document.querySelector(".legend li");

	if (!isSpheresExist || !isLegendExist) {
		await Promise.all([
			new Promise(resolve =>
				document.addEventListener("spheres-ready", resolve, { once: true }),
			),
			new Promise(resolve =>
				document.addEventListener("legend-ready", resolve, { once: true }),
			),
		]);
	}

	const container = document.querySelector(".spheres");
	const legendItems = document.querySelectorAll(".legend li");

	if (!container || !legendItems.length) return;

	const spheres = calculateScale(container);
	const { getPair } = buildElementMap(spheres, legendItems);

	const events = {
		mouseover: pair => toggleActive(pair, true),
		mouseout: pair => toggleActive(pair, false),
		click: pair => togglePinned(pair),
	};

	function toggleActive(pair, isOver) {
		pair.sphere?.classList.toggle("legend-active", isOver);
		pair.legend?.classList.toggle("sphere-active", isOver);
	}

	function togglePinned(pair) {
		pair.sphere?.classList.toggle("is-pinned");
		pair.legend?.classList.toggle("is-pinned");
	}

	Object.entries(events).forEach(([eventType, handler]) => {
		document.addEventListener(eventType, e => {
			const pair = getPair(e.target);
			if (pair) handler(pair);
		});
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initApp);
} else {
	initApp();
}
