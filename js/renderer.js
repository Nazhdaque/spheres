import { ColorConverter } from "./color.js";

export class DomRenderer {
	static #applyStyles(element, styles) {
		if (!styles || typeof styles !== "object") return;
		Object.entries(styles).forEach(([prop, val]) => {
			if (val !== "" && val !== null && val !== undefined) {
				element.style.setProperty(prop, val);
			}
		});
	}

	static render(data, targetContainer, settings = {}) {
		targetContainer.innerHTML = "";

		const rootEl = document.documentElement;
		this.#applyStyles(rootEl, settings.root);

		const fragment = document.createDocumentFragment();

		const legendWrapper = document.createElement("header");
		legendWrapper.className = "legend";
		this.#applyStyles(legendWrapper, settings.legend);

		if (data.title) {
			const titleEl = document.createElement("h1");
			titleEl.textContent = data.title;
			legendWrapper.appendChild(titleEl);
		}

		const legendList = document.createElement("ul");
		legendList.className = "legend__list";
		this.#applyStyles(legendList, settings.legendList);

		const spheresList = document.createElement("ul");
		spheresList.className = "spheres";
		this.#applyStyles(spheresList, settings.spheres);

		data.items.forEach(item => {
			const { l, c, h } = ColorConverter.hexToOklch(item.color);
			const colorString = `oklch(${l} ${c} ${h})`;

			const legendLi = document.createElement("li");
			legendLi.style.setProperty("--c-main", colorString);
			legendLi.textContent = item.legend;
			legendList.appendChild(legendLi);

			const sphereLi = document.createElement("li");
			sphereLi.style.setProperty("--value", item.value);
			sphereLi.style.setProperty("--c-main", colorString);
			sphereLi.textContent = item.value.toString().replace(".", ",");
			spheresList.appendChild(sphereLi);
		});

		legendWrapper.appendChild(legendList);

		fragment.appendChild(legendWrapper);
		fragment.appendChild(spheresList);

		targetContainer.appendChild(fragment);

		return {
			spheresContainer: spheresList,
			legendItems: legendList.children,
		};
	}
}
