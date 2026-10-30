export class ScaleManager {
	static CONFIG = {
		selectors: {
			targetItem: ".spheres > *, .legend li",
		},
		properties: {
			value: "--value",
			min: "--min",
			max: "--max",
		},
	};

	constructor(container, legendItems) {
		if (!container) return;
		this.container = container;
		this.legendItems = Array.from(legendItems);
		this.elementMap = new Map();

		this.spheres = this.calculateScale();
		this.buildElementMap();
	}

	calculateScale() {
		const props = ScaleManager.CONFIG.properties;
		const spheres = Array.from(this.container.children);
		if (!spheres.length) return [];

		const vals = spheres.map(li => {
			const val = parseFloat(li.style.getPropertyValue(props.value));
			return !val || val <= 0 ? 0.0001 : val;
		});

		this.container.style.setProperty(props.min, Math.min(...vals));
		this.container.style.setProperty(props.max, Math.max(...vals));
		return spheres;
	}

	buildElementMap() {
		this.spheres.forEach((sphere, index) => {
			const legend = this.legendItems[index] || null;
			const pair = { sphere, legend };

			this.elementMap.set(sphere, pair);
			if (legend) {
				this.elementMap.set(legend, pair);
			}
		});
	}

	getPair = target => {
		if (!target) return null;
		const item = target.closest(ScaleManager.CONFIG.selectors.targetItem);
		return item ? this.elementMap.get(item) : null;
	};
}
