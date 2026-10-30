export default class Lumen {
	constructor(container, options = {}) {
		this.container = container;
		this.ease = options.ease ?? 0.08;
		this.target = { x: 0.28, y: 0.72, z: 0.65 };
		this.current = { x: 0.28, y: 0.72, z: 0.65 };
		this.lastApplied = { x: 0, y: 0, z: 0 };
		this.isActive = false;

		this.init();
	}

	init() {
		if (this.isActive || !this.container) return;

		this.isActive = true;
		window.addEventListener("mousemove", this.onMouseMove, { passive: true });
		this.tick();
	}

	onMouseMove = event => {
		const { innerWidth: w, innerHeight: h } = window;
		const x = event.clientX / w;
		const y = 1 - event.clientY / h;

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

		const cx = Math.round(this.current.x * 1000) / 1000;
		const cy = Math.round(this.current.y * 1000) / 1000;
		const cz = Math.round(this.current.z * 1000) / 1000;

		if (
			cx !== this.lastApplied.x ||
			cy !== this.lastApplied.y ||
			cz !== this.lastApplied.z
		) {
			const style = this.container.style;
			style.setProperty("--light-pos-x", cx);
			style.setProperty("--light-pos-y", cy);
			style.setProperty("--light-pos-z", cz);

			this.lastApplied.x = cx;
			this.lastApplied.y = cy;
			this.lastApplied.z = cz;
		}

		requestAnimationFrame(this.tick);
	};

	destroy() {
		this.isActive = false;
		window.removeEventListener("mousemove", this.onMouseMove);
		this.container = null;
	}
}
