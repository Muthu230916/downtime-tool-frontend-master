import { Localization } from "../../interfaces/localization";

export class CauseProcess {
	constructor() {
		this.names = [];
	}
	public causeId?: number;
	public names: Localization[];
}
