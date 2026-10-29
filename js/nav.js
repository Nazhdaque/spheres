class ArrowNavigation {
	constructor(containerSelector, isInteractiveItems = false) {
		this.container = document.querySelector(containerSelector);
		if (!this.container) return;

		this.items = Array.from(this.container.children);
		if (!this.items.length) return;

		this.isInteractiveItems = isInteractiveItems;
		this.currentIdx = -1;
		this.initAttributes();
		this.initEvents();
	}

	initAttributes() {
		this.container.setAttribute("tabindex", "0");
		this.items.forEach(item => item.removeAttribute("tabindex"));
	}

	initEvents() {
		this.container.addEventListener("keydown", e => this.handleKeyDown(e));
		this.container.addEventListener("focusout", e => this.handleFocusOut(e));
	}

	handleKeyDown(e) {
		let isStepDown = e.key === "ArrowDown" || e.key === "ArrowRight";
		let isStepUp = e.key === "ArrowUp" || e.key === "ArrowLeft";
		const isAction = e.key === "Enter" || e.key === " ";

		if (!isStepDown && !isStepUp && !isAction) return;
		e.preventDefault();

		if (isAction) {
			this.triggerAction();
			return;
		}

		this.deactivateCurrent();
		this.calculateNextIndex(isStepDown, isStepUp);
		this.activateCurrent();
	}

	triggerAction() {
		if (this.currentIdx !== -1 && this.items[this.currentIdx]) {
			this.items[this.currentIdx].click();
		}
	}

	deactivateCurrent() {
		if (this.currentIdx !== -1 && this.items[this.currentIdx]) {
			this.items[this.currentIdx].dispatchEvent(
				new MouseEvent("mouseout", { bubbles: true }),
			);
			this.onItemDeactivate(this.items[this.currentIdx]);
		}
	}

	calculateNextIndex(isStepDown, isStepUp) {
		const isReverse =
			parseFloat(
				getComputedStyle(this.container).getPropertyValue("--is-reverse"),
			) === 1;
		if (isReverse) {
			const temp = isStepDown;
			isStepDown = isStepUp;
			isStepUp = temp;
		}

		if (this.currentIdx === -1) {
			this.currentIdx = isStepDown ? 0 : this.items.length - 1;
		} else {
			if (isStepDown) {
				this.currentIdx = (this.currentIdx + 1) % this.items.length;
			} else if (isStepUp) {
				this.currentIdx =
					this.currentIdx <= 0 ? this.items.length - 1 : this.currentIdx - 1;
			}
		}
	}

	activateCurrent() {
		if (this.items[this.currentIdx]) {
			this.items[this.currentIdx].dispatchEvent(
				new MouseEvent("mouseover", { bubbles: true }),
			);
			this.onItemActivate(this.items[this.currentIdx]);
		}
	}

	handleFocusOut(e) {
		if (this.container.contains(e.relatedTarget)) return;

		this.deactivateCurrent();
		this.resetContainerState();
		this.currentIdx = -1;
	}

	onItemActivate(item) {}
	onItemDeactivate(item) {}
	resetContainerState() {
		this.container.setAttribute("tabindex", "0");
	}
}

class SpheresNavigation extends ArrowNavigation {
	constructor(selector) {
		super(selector, true);
	}

	onItemActivate(item) {
		if (!this.container) return;
		this.container.setAttribute("tabindex", "-1");
		item.setAttribute("tabindex", "0");
		item.focus();
	}

	onItemDeactivate(item) {
		item.setAttribute("tabindex", "-1");
	}

	resetContainerState() {
		super.resetContainerState();
		if (this.currentIdx !== -1 && this.items[this.currentIdx]) {
			this.items[this.currentIdx].removeAttribute("tabindex");
		}
	}
}

class LegendNavigation extends ArrowNavigation {
	constructor(selector) {
		super(selector, false);
	}
}

export const initAccessibility = config => {
	new SpheresNavigation(config.spheres);
	new LegendNavigation(config.legend);
};
