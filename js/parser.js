export class DataParser {
	static parseTSV(tsvString) {
		if (!tsvString || typeof tsvString !== "string") {
			return { title: null, items: [] };
		}

		return tsvString
			.split(/\r?\n/)
			.map(line => line.trim())
			.filter(Boolean)
			.reduce(
				(acc, line) => {
					const [color = "", rawValue = "", legend = ""] = line
						.split("\t")
						.map(s => s.trim());

					if (!color && !rawValue && legend) {
						acc.title = legend;
						return acc;
					}

					if (!rawValue) {
						if (legend) acc.title = legend;
						return acc;
					}

					const parsedValue = parseFloat(rawValue.replace(",", "."));

					if (isNaN(parsedValue)) {
						if (legend) acc.title = legend;
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
