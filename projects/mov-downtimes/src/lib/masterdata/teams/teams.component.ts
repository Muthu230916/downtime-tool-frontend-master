import { Component, OnInit, OnDestroy } from "@angular/core";
import { TeamsService } from "../../core/services/teams.service";
import { Team } from "../../core/models/queries/team.model";
import { Subscription } from "rxjs";
import { TeamProcess } from "../../core/models/process/team.process.model";
import { LanguageCodes } from "../../core/enums/language-codes.enum";

@Component({
	selector: "lib-downtimes-teams",
	templateUrl: "./teams.component.html",
	styleUrls: ["./teams.component.css"]
})
export class TeamsComponent implements OnInit, OnDestroy {
	private teamsSubscription: Subscription;
	private addTeamSubscription: Subscription;
	private editTeamSubscription: Subscription;
	public teams: Team[];
	public currTeam?: Team;

	public name: string;
	private languageId: LanguageCodes;

	constructor(private teamsService: TeamsService) {}

	ngOnInit() {
		this.teamsSubscription = this.teamsService.all$.subscribe(t => (this.teams = t));

		this.languageId = LanguageCodes.English;
	}

	ngOnDestroy() {
		this.teamsSubscription.unsubscribe();

		if (this.addTeamSubscription) {
			this.addTeamSubscription.unsubscribe();
		}

		if (this.editTeamSubscription) {
			this.editTeamSubscription.unsubscribe();
		}
	}

	private updateTeams() {
		this.teamsService.getAll();
	}

	public prepareEdit(team: Team) {
		this.currTeam = Object.create(team);
	}

	public addTeam() {
		const createTeam = new TeamProcess();

		createTeam.names.push({
			name: this.name,
			languageId: this.languageId
		});

		if (this.addTeamSubscription) {
			this.addTeamSubscription.unsubscribe();
		}

		this.addTeamSubscription = this.teamsService
			.addOrEdit(createTeam)
			.subscribe(() => this.updateTeams());
	}

	public editTeam() {
		const editTeam = new TeamProcess();

		editTeam.teamId = this.currTeam.uiid;
		editTeam.names.push({
			name: this.currTeam.name,
			languageId: this.languageId
		});

		if (this.editTeamSubscription) {
			this.editTeamSubscription.unsubscribe();
		}

		this.editTeamSubscription = this.teamsService
			.addOrEdit(editTeam)
			.subscribe(() => this.updateTeams());
	}
}
