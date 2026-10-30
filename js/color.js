export class ColorConverter {
	static hexToRgb(hex) {
		const clean = hex.replace("#", "");
		const num = parseInt(clean, 16);
		return [
			((num >> 16) & 255) / 255,
			((num >> 8) & 255) / 255,
			(num & 255) / 255,
		];
	}

	static rgbToXyz(r, g, b) {
		const f = c =>
			c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
		const lr = f(r);
		const lg = f(g);
		const lb = f(b);

		return [
			lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375,
			lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175,
			lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041,
		];
	}

	static xyzToOklch(x, y, z) {
		const l_ = Math.cbrt(
			x * 0.8189330101 + y * 0.3618667424 - z * 0.1288597137,
		);
		const m_ = Math.cbrt(
			x * 0.0329845436 + y * 0.9293118715 + z * 0.0361430881,
		);
		const s_ = Math.cbrt(x * 0.0482003018 + y * 0.2643497082 + z * 0.633851707);

		const L = l_ * 0.2104542553 + m_ * 0.793617785 - s_ * 0.0040720403;
		const a = l_ * 1.9779984951 - m_ * 2.428592205 + s_ * 0.4505937099;
		const b = l_ * 0.0259040371 + m_ * 0.7827717662 - s_ * 0.808675766;

		const C = Math.sqrt(a * a + b * b);
		let hRad = Math.atan2(b, a);
		let H = hRad * (180 / Math.PI);
		if (H < 0) H += 360;

		return {
			l: parseFloat(L.toFixed(4)),
			c: parseFloat(C.toFixed(4)),
			h: parseFloat(H.toFixed(2)),
		};
	}

	static hexToOklch(hex) {
		if (!hex) return { l: 0, c: 0, h: 0 };
		const [r, g, b] = this.hexToRgb(hex);
		const [x, y, z] = this.rgbToXyz(r, g, b);
		return this.xyzToOklch(x, y, z);
	}
}
