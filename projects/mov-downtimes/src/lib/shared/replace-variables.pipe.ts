import { Pipe, PipeTransform } from "@angular/core";

/*
    This expects that all values that are substitue
    will be on the same order as values that are
    found to have the condition @example@ on a string
    also expects it to have the same lenght of array
*/

@Pipe({ name: "replaceVariables", pure: false })
export class ReplaceVariablesPipe implements PipeTransform {
	transform(value: string, substitueVals: Substitue): string {
		let result = value;
		const regEx = /@[A-Za-z]+@/g;
		const valsToBeReplaced = value.match(regEx);

		for (const x of valsToBeReplaced) {
			const key = x.split("@").join("");
			if (key in substitueVals) {
				// tslint:disable-next-line: quotemark
				result = result.replace(x, '"' + substitueVals[key] + '"');
			}
		}

		return result;
	}
}

interface Substitue {
	[key: string]: string | number;
}
