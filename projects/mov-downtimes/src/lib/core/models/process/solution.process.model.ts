import { Localization } from "../../interfaces/localization";

export class SolutionProcess {
	constructor() {
		this.names = [];
	}
	public solutionId?: number;
	public names: Localization[];
}
