import moment, { Duration } from "moment";
import { Injectable } from "@angular/core";

@Injectable({
	providedIn: "root"
})
export class DateTimeService {
	constructor() {}

	public toDurationString(duration: Duration): string {
		return (
			Math.floor(duration.asHours())
				.toString()
				.padStart(2, "0") +
			":" +
			duration
				.minutes()
				.toString()
				.padStart(2, "0") +
			":" +
			duration
				.seconds()
				.toString()
				.padStart(2, "0")
		);
	}
}
