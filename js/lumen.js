export default class Lumen {
	constructor(container, options = {}) {
		this.container = container;
		this.ease = options.ease ?? 0.08;
		this.target = { x: 0.28, y: 0.72, z: 0.65 };
		this.current = { x: 0.28, y: 0.72, z: 0.65 };
		this.isActive = false;

		this.init();
	}

	init() {
		if (this.isActive || !this.container) return;

		this.isActive = true;
		window.addEventListener("mousemove", this.onMouseMove);
		this.tick();
	}

	onMouseMove = event => {
		const x = event.clientX / window.innerWidth;
		const y = 1 - event.clientY / window.innerHeight;

		const distX = Math.abs(x - 0.5) * 2;
		const distY = Math.abs(y - 0.5) * 2;
		const maxDist = Math.sqrt(distX * distX + distY * distY);
		const z = Math.max(0.0, Math.min(1.0, 1.0 - maxDist * 0.75));

		this.target.x = Math.max(0.0, Math.min(1.0, x));
		this.target.y = Math.max(0.0, Math.min(1.0, y));
		this.target.z = z;
	};

	tick = () => {
		if (!this.isActive) return;

		this.current.x += (this.target.x - this.current.x) * this.ease;
		this.current.y += (this.target.y - this.current.y) * this.ease;
		this.current.z += (this.target.z - this.current.z) * this.ease;

		this.container.style.setProperty(
			"--light-pos-x",
			this.current.x.toFixed(3),
		);
		this.container.style.setProperty(
			"--light-pos-y",
			this.current.y.toFixed(3),
		);
		this.container.style.setProperty(
			"--light-pos-z",
			this.current.z.toFixed(3),
		);

		requestAnimationFrame(this.tick);
	};

	destroy() {
		this.isActive = false;
		window.removeEventListener("mousemove", this.onMouseMove);
		this.container = null;
	}
}
