import { Component, OnInit, OnDestroy } from "@angular/core";

import { ActivitiesService } from "../../core/services/activities.service";
import { Activity } from "../../core/models/queries/activity.model";
import { Subscription, BehaviorSubject, Subject, of, ReplaySubject } from "rxjs";
import { ActivityDetails } from "../../core/models/details/activity.details";
import { CausesService } from "../../core/services/causes.service";
import { Cause } from "../../core/models/queries/cause.model";
import { Localization } from "../../core/interfaces/localization";
import { CauseDetails } from "../../core/models/details/cause.details.model";
import { Solution } from "../../core/models/queries/solution.model";
import { SolutionsService } from "../../core/services/solutions.service";
import { SolutionDetails } from "../../core/models/details/solution.details.model";
import { FormControl } from "@angular/forms";
import { takeUntil } from "rxjs/operators";
import { LocalizationModalConfig } from "../../core/interfaces/localization-modal-config";
import { LocalizationModalComponent } from "../../shared/modals/localization-modal/localization-modal.component";
import { MatDialog } from "@angular/material";
import { LanguageCodes } from "../../core/enums/language-codes.enum";
import { TranslateService } from "@movilitas/mov-base";

@Component({
	selector: "lib-downtimes-activities",
	templateUrl: "./activities.component.html",
	styleUrls: ["./activities.component.css"],
})
export class ActivitiesComponent implements OnInit, OnDestroy {
	private rootActivitiesSubject: BehaviorSubject<Activity[]> = new BehaviorSubject<Activity[]>(
		[]
	);
	private rootActivitiesSubscrition: Subscription;
	public rootActivities$ = this.rootActivitiesSubject.asObservable();
	private saveActivitySubscription: Subscription;
	public activeActivity?: ActivityDetails;

	public languageId = LanguageCodes.English;
	public name = "";
	public description = "";
	private selectedActivitySubscription: Subscription;
	private hasParentQueued = false;
	private parentActivityForNewChildActivity: number;
	public causesCount = "";
	public solutionsCount = "";
	private causesSubscription: Subscription;
	public allCauses: Cause[];
	private soltuionsSubscription: Subscription;
	public allSolutions: Solution[];

	// Filter for solution select
	public allSolutionsCtrl: FormControl = new FormControl();
	public allSolutionsFilterCtrl: FormControl = new FormControl();
	public filteredSolutions: ReplaySubject<Solution[]> = new ReplaySubject<Solution[]>(1);

	// Filter for causes select
	public allCausesCtrl: FormControl = new FormControl();
	public allCausesFilterCtrl: FormControl = new FormControl();
	public filteredCauses: ReplaySubject<Cause[]> = new ReplaySubject<Cause[]>(1);

	protected _onDestroy = new Subject<void>();

	constructor(
		private activitiesService: ActivitiesService,
		private solutionsService: SolutionsService,
		private causesService: CausesService,
		public dialog: MatDialog,
		private translateService: TranslateService
	) {}

	public ngOnInit() {
		this.rootActivitiesSubscrition = this.activitiesService.rootActivities$.subscribe(
			(data) => {
				this.rootActivitiesSubject.next(data);
			}
		);

		this.activitiesService.sync(this.languageId);

		this.resetActivityRelations();

		this.allSolutionsFilterCtrl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
			this.filterSolutions();
		});

		this.allCausesFilterCtrl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
			this.filterCauses();
		});
	}

	private resetActivityRelations() {
		if (this.causesSubscription) {
			this.causesSubscription.unsubscribe();
		}

		if (this.soltuionsSubscription) {
			this.soltuionsSubscription.unsubscribe();
		}

		this.causesSubscription = this.causesService.all$.subscribe((c) => {
			this.allCauses = c;
			this.allCausesCtrl.setValue(this.allCauses);
			this.filteredCauses.next(this.allCauses.slice());
		});

		this.soltuionsSubscription = this.solutionsService.all$.subscribe((s) => {
			this.allSolutions = s;
			this.allSolutionsCtrl.setValue(this.allSolutions);
			this.filteredSolutions.next(this.allSolutions.slice());
		});
	}

	public ngOnDestroy() {
		this.rootActivitiesSubscrition.unsubscribe();
		this.causesSubscription.unsubscribe();
		this.soltuionsSubscription.unsubscribe();

		if (this.selectedActivitySubscription) {
			this.selectedActivitySubscription.unsubscribe();
		}
		if (this.saveActivitySubscription) {
			this.saveActivitySubscription.unsubscribe();
		}

		this._onDestroy.next();
		this._onDestroy.complete();
	}

	protected filterSolutions() {
		if (!this.allSolutions) {
			return;
		}

		let search = this.allSolutionsFilterCtrl.value;
		if (!search) {
			this.filteredSolutions.next(this.allSolutions.slice());
			return;
		} else {
			search = search.toLowerCase();
		}

		this.filteredSolutions.next(
			this.allSolutions.filter((sl) => sl.name.toLowerCase().indexOf(search) > -1)
		);
	}

	protected filterCauses() {
		if (!this.allCauses) {
			return;
		}

		let search = this.allCausesFilterCtrl.value;
		if (!search) {
			this.filteredCauses.next(this.allCauses.slice());
			return;
		} else {
			search = search.toLowerCase();
		}

		this.filteredCauses.next(
			this.allCauses.filter((c) => c.name.toLowerCase().indexOf(search) > -1)
		);
	}

	public selectActivity(id: number) {
		if (this.selectedActivitySubscription) {
			this.selectedActivitySubscription.unsubscribe();
		}

		this.parentActivityForNewChildActivity = undefined;

		this.selectedActivitySubscription = this.activitiesService.getDetails(id).subscribe(
			(activity) => {
				this.activateActivity(activity);
			},
			() => this.activateActivity(undefined)
		);
	}

	public prepareNewActivity(parentActivity?: number) {
		if (parentActivity) {
			this.parentActivityForNewChildActivity = parentActivity;
		} else {
			this.parentActivityForNewChildActivity = undefined;
		}

		this.hasParentQueued = parentActivity ? true : false;
		this.activateActivity(new ActivityDetails());
		this.activeActivity.parentActivity = parentActivity;
	}

	public activateActivity(activity: ActivityDetails | undefined) {
		let causes = [];
		let solutions = [];

		if (activity) {
			activity.causes = activity.causes || [];
			activity.solutions = activity.solutions || [];
			activity.names = activity.names || [
				{ name: "", languageId: LanguageCodes.English, description: "" },
			];
			activity.descriptions = activity.descriptions || [
				{ name: "", languageId: LanguageCodes.English, description: "" },
			];
			causes = activity.causes;
			solutions = activity.solutions;
		}

		this.activeActivity = activity;

		if (this.parentActivityForNewChildActivity) {
			this.activeActivity.parentActivity = this.parentActivityForNewChildActivity;
		}

		this.resetActivityRelations();
		this.setCausesCount(causes.length);
		this.setSolutionCount(solutions.length);
		this.filterAllCausesFromLinked(causes);
		this.filterAllSolutionsFromLinked(solutions);

		const names = this.activeActivity
			? this.activeActivity.names
			: [{ name: "", languageId: LanguageCodes.English, description: "" }];
		const descriptions = this.activeActivity
			? this.activeActivity.descriptions
			: [{ name: "", languageId: LanguageCodes.English, description: "" }];
		// this assumes we always have name/desc value for choosen
		// language from langServ.getLanguageCode if we have names for that activity
		// this can change in future
		this.setLocalNameFromActivity(names);
		this.setLocalDescriptionFromActivity(descriptions);
	}

	private setLocalNameFromActivity(names?: Localization[]) {
		this.name = names
			? names.find((n) => n.languageId === this.languageId).name
			: names[0].name;
	}

	private filterAllCausesFromLinked(causes: CauseDetails[]) {
		this.allCauses = this.allCauses.filter((c) => !causes.some((lc) => lc.causeId === +c.uiid));
	}

	public addLinkedCause(cause: Cause) {
		const cIdx = this.allCauses.findIndex((ca) => ca.uiid === cause.uiid);

		this.allCauses.splice(cIdx, 1);
		this.activeActivity.causes = this.activeActivity.causes || [];
		this.activeActivity.causes.push({
			causeId: +cause.uiid,
			names: [{ name: cause.name, languageId: this.languageId }],
			id: cause.uiid + "",
		});
	}

	public removeLinkedCause(cause: CauseDetails) {
		const lcIdx = this.activeActivity.causes.findIndex((c) => c.causeId === cause.causeId);

		this.activeActivity.causes.splice(lcIdx, 1);
		this.allCauses.push({
			name: cause.names[0].name,
			uiid: cause.causeId + "",
		});
	}

	private filterAllSolutionsFromLinked(solutions: SolutionDetails[]) {
		this.allSolutions = this.allSolutions.filter(
			(s) => !solutions.some((ls) => ls.solutionId === +s.uiid)
		);
	}

	public addLinkedSolution(solution: Solution) {
		const sIdx = this.allSolutions.findIndex((sa) => sa.uiid === solution.uiid);

		this.allSolutions.splice(sIdx, 1);
		this.activeActivity.solutions = this.activeActivity.solutions || [];
		this.activeActivity.solutions.push({
			solutionId: +solution.uiid,
			names: [{ name: solution.name, languageId: this.languageId }],
		});
	}

	public removeLinkedSolution(solution: SolutionDetails) {
		const lsIdx = this.activeActivity.solutions.findIndex(
			(c) => c.solutionId === solution.solutionId
		);

		this.activeActivity.solutions.splice(lsIdx, 1);
		this.allSolutions.push({
			name: solution.names[0].name,
			uiid: solution.solutionId + "",
		});
	}

	private setLocalDescriptionFromActivity(descriptions?: Localization[]) {
		this.description = descriptions
			? descriptions.find((n) => n.languageId === this.languageId).description
			: "";
	}

	private setCausesCount(count: number) {
		this.causesCount = count > 0 ? `(${count})` : "";
	}

	private setSolutionCount(count: number) {
		this.solutionsCount = count > 0 ? `(${count})` : "";
	}

	public cancel() {
		if (this.hasParentQueued) {
			this.selectActivity(this.activeActivity.parentActivity);
			this.hasParentQueued = false;
		} else {
			this.activateActivity(undefined);
		}

		this.parentActivityForNewChildActivity = undefined;
	}

	private setNameForActiveActivity(value: string) {
		if (this.name === "") {
			return;
		}

		this.activeActivity.names = this.activeActivity.names || [];

		const actvName = this.activeActivity.names.find((nm) => nm.languageId === this.languageId);

		if (actvName) {
			actvName.name = value;
		} else {
			this.activeActivity.names.push({
				name: value,
				languageId: this.languageId,
			});
		}
	}

	private setDescriptionForActiveActivity(value: string) {
		const descriptions = this.activeActivity.descriptions;

		if (value === "") {
			if (descriptions) {
				const actvDescriptionIdx = this.activeActivity.descriptions.findIndex(
					(nm) => nm.languageId === this.languageId
				);

				if (actvDescriptionIdx > -1) {
					this.activeActivity.descriptions.splice(actvDescriptionIdx, 1);
				}
			}

			return;
		}

		if (descriptions && descriptions.length > 0) {
			const actvDescription = this.activeActivity.descriptions.find(
				(nm) => nm.languageId === this.languageId
			);
			actvDescription.description = value;
		} else {
			this.activeActivity.descriptions = [];
			this.activeActivity.descriptions.push({
				description: value,
				languageId: this.languageId,
			});
		}
	}

	public saveActivity() {
		this.setNameForActiveActivity(this.name);
		this.setDescriptionForActiveActivity(this.description);
		this.saveActivitySubscription = this.activitiesService
			.addActivity(this.activeActivity)
			.subscribe((r: { uiid: number }) => {
				this.selectActivity(r.uiid);
				this.activitiesService.getRootActivities(this.languageId);
			});
	}

	public localizeName() {
		this.nameLocalizationModal(
			this.activeActivity.names,
			"name translation or change existing"
		);
	}

	public localizeDescription() {
		this.descriptionLocalizationModal(
			this.activeActivity.descriptions,
			"description translation or change existing"
		);
	}

	private nameLocalizationModal(model: Localization[], subjectTitle: string) {
		const data: LocalizationModalConfig = {
			data: model,
			subjectTitle,
		};
		const dialogRef = this.dialog.open(LocalizationModalComponent, {
			width: "650px",
			data,
		});

		dialogRef.afterClosed().subscribe((changedModel) => {
			if (changedModel) {
				this.activeActivity.names = changedModel.data;
			}
		});
	}

	private descriptionLocalizationModal(model: Localization[], subjectTitle: string) {
		const namesToDescriptions: Localization[] = [];
		for (const n of model as Localization[]) {
			n.name = n.description;
			namesToDescriptions.push(n);
		}
		const data: LocalizationModalConfig = {
			data: namesToDescriptions,
			subjectTitle,
		};
		const dialogRef = this.dialog.open(LocalizationModalComponent, {
			width: "650px",
			data,
		});

		dialogRef.afterClosed().subscribe((changedModel) => {
			if (changedModel) {
				for (const d of changedModel.data as Localization[]) {
					d.description = d.name;
					d.name = undefined;
					this.activeActivity.descriptions.push(d);
				}
			}
		});
	}
}
