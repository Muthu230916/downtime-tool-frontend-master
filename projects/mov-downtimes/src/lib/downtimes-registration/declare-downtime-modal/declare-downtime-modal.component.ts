import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { DowntimesService } from "../../core/services/downtimes.service";
import { Activity } from "../../core/models/queries/activity.model";
import { BehaviorSubject, Subscription } from "rxjs";
import { Cause } from "../../core/models/queries/cause.model";
import { Solution } from "../../core/models/queries/solution.model";
import { ActivitiesService } from "../../core/services/activities.service";
import { Location } from "../../core/models/queries/location.model";
import { TeamsService } from "../../core/services/teams.service";
import { Team } from "../../core/models/queries/team.model";
import { DowntimeProcess } from "../../core/models/process/downtime.process.model";
import { ShowDowntimeItem } from "../../core/models/queries/downtime.model";
import { ActivityWithTextColor } from "../../core/services/color.service";
import { EquipmentService } from "../../core/services/equipment.service";

@Component({
	selector: "lib-downtimes-declare-downtime-modal",
	templateUrl: "./declare-downtime-modal.component.html",
	styleUrls: ["./declare-downtime-modal.component.css"],
})
export class DeclareDowntimeModalComponent implements OnInit, OnDestroy {
	public showActivities = true;
	public activitiesToShow: ActivityWithTextColor[] = [];
	public allActivities!: Activity[];
	public activeActivityName$: BehaviorSubject<string> = new BehaviorSubject("");
	public activeActivity?: Activity;
	public causes?: Cause[];
	public selectedCauseId?: string;
	public solutions?: Solution[];
	public selectedSolutionId?: string;
	public locations?: Location[];
	public selectedLocationId?: string;
	public teams?: Team[];
	public selectedTeamId?: string;
	private causesSubscription: Subscription;
	private solutionsSubscription: Subscription;
	private locationsSubscription: Subscription;
	private teamsSubscription: Subscription;
	// public comment: string;
	private downtime: ShowDowntimeItem;
	private declarationSubscription: Subscription;

	constructor(
		public dialogRef: MatDialogRef<DeclareDowntimeModalComponent>,
		@Inject(MAT_DIALOG_DATA) public data: DialogData,
		private downtimesService: DowntimesService,
		private activitiesService: ActivitiesService,
		private teamsService: TeamsService,
		private equipmentService: EquipmentService
	) {}

	ngOnInit() {
		this.downtime = this.data.downtime;
		this.allActivities = this.equipmentService.getActivitiesForEquipment(
			this.downtime.WorkCenter
		);

		this.showActivities = true;

		if (this.allActivities) {
			this.allActivities = this.removeDuplicates(this.allActivities, "name");
			this.activitiesToShow = this.getRootActivities();
		}

		this.getLocationsForEquipment();
		this.getTeams();
	}

	private removeDuplicates(arrayX, prop) {
		return arrayX.filter((obj, pos, arr) => {
			return arr.map((mapObj) => mapObj[prop]).indexOf(obj[prop]) === pos;
		});
	}

	onNoClick(): void {
		this.dialogRef.close();
	}

	private hasChildren(uiid: string) {
		return this.allActivities.some((ac) => ac.parentActivity === uiid);
	}

	private getRootActivities() {
		return this.allActivities
			.filter((ac) => ac.parentActivity === "")
			.map((ac) => this.activitiesService.getActivityWithTextColor(ac));
	}

	private getChildrenByParent(uiid: string) {
		return this.allActivities
			.filter((ac) => ac.parentActivity === uiid)
			.map((ac) => this.activitiesService.getActivityWithTextColor(ac));
	}

	private getParentByChildren(childActivity: Activity) {
		if (childActivity.parentActivity === "") {
			return undefined;
		}

		return this.allActivities.find((ac) => ac.uiid === childActivity.parentActivity);
	}

	public requiresSolution() {
		if (this.showActivities) {
			return false;
		}

		return JSON.parse(this.activeActivity.isSolutionMandatory);
	}

	public requiresCause() {
		if (this.showActivities) {
			return false;
		}

		return JSON.parse(this.activeActivity.isCauseMandatory);
	}

	public home() {
		this.showActivities = true;
		this.activeActivityName$.next("");
		this.activeActivity = undefined;
		this.activitiesToShow = this.getRootActivities();
	}

	public onActivityClick(activity: Activity) {
		this.activeActivity = activity;
		this.activeActivityName$.next(activity.name);
		this.showActivities = true;
		this.selectedCauseId = undefined;
		this.selectedSolutionId = undefined;
		this.selectedLocationId = undefined;
		this.selectedTeamId = undefined;

		if (this.hasChildren(activity.uiid)) {
			this.activitiesToShow = this.getChildrenByParent(activity.uiid);
		} else {
			this.getSolutionsForActivity();
			this.getCausesForActivity();
			this.showActivities = false;
			this.activitiesToShow = [];
		}
	}

	private getCausesForActivity() {
		if (this.causesSubscription) {
			this.causesSubscription.unsubscribe();
		}

		this.causesSubscription = this.activitiesService
			.getCausesForActivity(this.activeActivity.uiid)
			.subscribe((c) => (this.causes = c));
	}

	private getSolutionsForActivity() {
		if (this.solutionsSubscription) {
			this.solutionsSubscription.unsubscribe();
		}

		this.solutionsSubscription = this.activitiesService
			.getSolutionsForActivity(this.activeActivity.uiid)
			.subscribe((s) => (this.solutions = s));
	}

	private getLocationsForEquipment() {
		if (this.locationsSubscription) {
			this.locationsSubscription.unsubscribe();
		}

		this.locationsSubscription = this.downtimesService
			.getLocationsByEquipment(this.downtime.WorkCenter)
			.subscribe((l) => (this.locations = l));
	}

	private getTeams() {
		if (this.teamsSubscription) {
			this.teamsSubscription.unsubscribe();
		}

		this.teamsSubscription = this.teamsService.all$.subscribe((t) => (this.teams = t));
	}

	public canSave() {
		const causeCheck = !this.requiresCause() ? true : !!this.selectedCauseId;
		const solutionCheck = !this.requiresSolution() ? true : !!this.selectedSolutionId;

		return causeCheck && solutionCheck;
	}

	public save() {
		if (this.showActivities) {
			return;
		}

		const downtimeProcess = new DowntimeProcess();
		downtimeProcess.activityId = this.activeActivity.uiid;
		// downtimeProcess.comment = this.comment;
		downtimeProcess.downtimeId = this.downtime.ID;
		downtimeProcess.endTime = this.downtime.Stop;
		downtimeProcess.equipmentId = {
			id: this.downtime.WorkCenter,
			type: "EQUIPMENT",
		};
		downtimeProcess.startTime = this.downtime.Start;

		if (this.selectedCauseId) {
			downtimeProcess.cause = { causeId: this.selectedCauseId };
		}

		if (this.selectedSolutionId) {
			downtimeProcess.solution = { solutionId: this.selectedSolutionId };
		}

		if (this.selectedTeamId) {
			downtimeProcess.team = { teamId: this.selectedTeamId };
		}

		this.declarationSubscription = this.downtimesService
			.declareDowntime(downtimeProcess)
			.subscribe(
				(d) => this.dialogRef.close(d),
				() => this.dialogRef.close()
			);
	}

	public ngOnDestroy() {
		this.teamsSubscription.unsubscribe();
		this.locationsSubscription.unsubscribe();

		if (this.solutionsSubscription) {
			this.solutionsSubscription.unsubscribe();
		}

		if (this.causesSubscription) {
			this.causesSubscription.unsubscribe();
		}

		if (this.declarationSubscription) {
			this.declarationSubscription.unsubscribe();
		}
	}
}

export interface DialogData {
	downtime: ShowDowntimeItem;
}
