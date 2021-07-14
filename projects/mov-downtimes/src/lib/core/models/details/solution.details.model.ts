import { Localization } from "../../interfaces/localization";
import { Base } from "./base.details.model";

export class SolutionDetails extends Base {
	constructor() {
		super();
		this.names = [];
	}

	public activityId?: number;
	public solutionId?: number;
	public names: Localization[];
}
