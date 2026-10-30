export class DataParser {
	static parseTSV(tsvString) {
		if (!tsvString || typeof tsvString !== "string") {
			return { title: null, items: [] };
		}

		return tsvString
			.split(/\r?\n/)
			.filter(line => line.trim() !== "")
			.reduce(
				(acc, line) => {
					const parts = line.split("\t").map(s => s.trim());
					const color = parts[0] ?? "";
					const rawValue = parts[1] ?? "";
					const legend = parts[2] ?? "";

					if (!rawValue && legend) {
						acc.title = legend;
						return acc;
					}

					if (!rawValue) {
						return acc;
					}

					const parsedValue = parseFloat(rawValue.replace(",", "."));

					if (isNaN(parsedValue)) {
						if (legend && legend.toLowerCase() !== "legend") {
							acc.title = legend;
						}
						return acc;
					}

					acc.items.push({
						color,
						value: parsedValue,
						legend,
					});

					return acc;
				},
				{ title: null, items: [] },
			);
	}
}
