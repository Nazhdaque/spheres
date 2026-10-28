export function calculateScale(container) {
	const spheres = Array.from(container.children);
	const vals = spheres.map(li => {
		const val = parseFloat(li.style.getPropertyValue("--value"));
		return !val || val <= 0 ? 0.0001 : val;
	});
	container.style.setProperty("--min", Math.min(...vals));
	container.style.setProperty("--max", Math.max(...vals));
	return spheres;
}

export function buildElementMap(spheres, legendItems) {
	const elementMap = new Map();
	const normalizeColor = el => el.style.getPropertyValue("--c-main")?.trim();

	spheres.forEach(sphere => {
		const color = normalizeColor(sphere);
		if (color) {
			sphere.dataset.color = color;
			elementMap.set(color, { sphere, legend: null });
		}
	});

	legendItems.forEach(legend => {
		const color = normalizeColor(legend);
		if (color) {
			legend.dataset.color = color;
			const pair = elementMap.get(color);
			if (pair) pair.legend = legend;
		}
	});

	return {
		getPair: target => {
			const item = target.closest(".spheres > *, .legend li");
			return item ? elementMap.get(item.dataset.color) : null;
		},
	};
}
