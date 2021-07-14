export class BaseServiceDefinition {
	public resultsFlattenAndMerge(data: any[]) {
		const formated = [];
		const merged = [].concat.apply([], data);

		for (const item of merged) {
			if (item) {
				formated.push(item);
			}
		}

		return formated;
	}
}
