import { Localization } from "../../interfaces/localization";
import { Base } from "./base.details.model";

export class CauseDetails extends Base {
	constructor() {
		super();
		this.names = [];
	}

	public activityId?: number;
	public causeId?: number;
	public names: Localization[];
	public id: string;
}
