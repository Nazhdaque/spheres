import Papa from "papaparse";

export default class DataParser {
	static parseTSV(tsvString) {
		if (!tsvString || typeof tsvString !== "string") {
			return { title: null, items: [] };
		}

		const result = { title: null, items: [] };

		const parsed = Papa.parse(tsvString, {
			delimiter: "\t",
			skipEmptyLines: "greedy",
		});

		parsed.data.forEach(parts => {
			const color = parts[0] ?? "";
			const rawValue = parts[1] ?? "";
			const legend = parts[2] ?? "";

			if (!rawValue && legend) {
				result.title = legend;
				return;
			}

			if (!rawValue) return;

			const parsedValue = parseFloat(rawValue.replace(",", "."));

			if (isNaN(parsedValue)) {
				if (legend && legend.toLowerCase() !== "legend") {
					result.title = legend;
				}
				return;
			}

			result.items.push({
				color,
				value: parsedValue,
				legend,
			});
		});

		return result;
	}
}
