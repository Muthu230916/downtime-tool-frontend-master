import { Injectable } from "@angular/core";
import { DataProxyService } from "./data-proxy.service";
import { BehaviorSubject } from "rxjs";
import { Team } from "../models/queries/team.model";
import { TeamProcess } from "../models/process/team.process.model";

@Injectable({
	providedIn: "root"
})
export class TeamsService {
	private allSubject: BehaviorSubject<Team[]> = new BehaviorSubject<Team[]>([]);

	public all$ = this.allSubject.asObservable();

	constructor(private dataProxyService: DataProxyService) {
		this.getAll();
	}

	public getAll(offset?: number, limit?: number) {
		this.dataProxyService
			.getData("SELECT t.teamId @uiid@, n.name FROM Team t JOIN t.names n", offset, limit)
			.subscribe(t => this.allSubject.next(t));
	}

	public addOrEdit(team: TeamProcess) {
		return this.dataProxyService.executeService("/Team/process", team);
	}
}
