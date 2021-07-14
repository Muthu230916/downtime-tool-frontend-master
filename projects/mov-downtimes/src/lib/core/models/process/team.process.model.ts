import { Name } from "../queries/name.model";

export class TeamProcess {
	public names: Name[];
	public teamId?: string;

	constructor() {
		this.names = [];
		this.teamId = undefined;
	}
}
