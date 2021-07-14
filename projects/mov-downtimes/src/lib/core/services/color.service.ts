import { Injectable } from "@angular/core";
import { Activity } from "../models/queries/activity.model";

@Injectable({
	providedIn: "root"
})
export class ColorService {
	constructor() {}

	public hexToRgb(hex: string): number[] | undefined {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

		if (result) {
			const r = parseInt(result[1], 16);
			const g = parseInt(result[2], 16);
			const b = parseInt(result[3], 16);

			return [r, g, b];
		}

		return undefined;
	}
}

export interface ActivityWithTextColor extends Activity {
	textColor?: "white" | "black";
}
