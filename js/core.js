export class ScaleManager {
	static CONFIG = {
		selectors: {
			targetItem: ".spheres > *, .legend li",
		},
		properties: {
			value: "--value",
			min: "--min",
			max: "--max",
			color: "--c-main",
		},
	};

	constructor(container, legendItems) {
		this.container = container;
		this.legendItems = Array.from(legendItems);
		this.elementMap = new Map();

		this.spheres = this.calculateScale();
		this.buildElementMap();
	}

	calculateScale() {
		const props = ScaleManager.CONFIG.properties;
		const spheres = Array.from(this.container.children);
		const vals = spheres.map(li => {
			const val = parseFloat(li.style.getPropertyValue(props.value));
			return !val || val <= 0 ? 0.0001 : val;
		});

		this.container.style.setProperty(props.min, Math.min(...vals));
		this.container.style.setProperty(props.max, Math.max(...vals));
		return spheres;
	}

	normalizeColor(el) {
		return el.style
			.getPropertyValue(ScaleManager.CONFIG.properties.color)
			?.trim();
	}

	buildElementMap() {
		this.spheres.forEach(sphere => {
			const color = this.normalizeColor(sphere);
			if (color) {
				sphere.dataset.color = color;
				this.elementMap.set(color, { sphere, legend: null });
			}
		});

		this.legendItems.forEach(legend => {
			const color = this.normalizeColor(legend);
			if (color) {
				legend.dataset.color = color;
				const pair = this.elementMap.get(color);
				if (pair) pair.legend = legend;
			}
		});
	}

	getPair(target) {
		const item = target.closest(ScaleManager.CONFIG.selectors.targetItem);
		return item ? this.elementMap.get(item.dataset.color) : null;
	}
}
