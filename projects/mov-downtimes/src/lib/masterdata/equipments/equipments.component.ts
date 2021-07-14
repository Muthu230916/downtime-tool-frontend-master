import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { ActivitiesService } from "../../core/services/activities.service";
import { EquipmentService } from "../../core/services/equipment.service";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { Subscription, Subject, Observable } from "rxjs";
import { FormControl } from "@angular/forms";
import { takeUntil } from "rxjs/operators";
import { ActivityDetails } from "../../core/models/details/activity.details";
import { AssignEquipmentOrClassProcess } from "../../core/models/process/assign-equipment-or-class.process.model";
import { MatTableDataSource, MatDialog } from "@angular/material";
import { EquipmentLocationDetails } from "../../core/models/details/equipment-location.details";
import { LocalizationModalComponent } from "../../shared/modals/localization-modal/localization-modal.component";
import { EquipmentLocationProcess } from "../../core/models/process/equipment-location.process.model";
import { LocalizationModalConfig } from "../../core/interfaces/localization-modal-config";
import { fadeInLeftBigOnEnterAnimation } from "angular-animations";
import { SettingsService } from "../../core/services/settings.service";
import { Setting } from "../../core/models/queries/setting.model";
import { EquipmentClass } from "../../core/models/queries/equipment-class.model";
import { Equipment } from "../../core/models/queries/equipment.model";
import { EquipmentOrClassProcess } from "../../core/models/process/equipment-or-class.process.model";
import { AddEquipmentClassModalComponent } from "./add-equipment-class-modal/add-equipment-class-modal.component";
import { AddEquipmentModalComponent } from "./add-equipment-modal/add-equipment-modal.component";

@Component({
	selector: "lib-downtimes-equipments",
	animations: [
		fadeInLeftBigOnEnterAnimation({
			anchor: "enter",
			duration: 500,
			delay: 0,
			translate: "30px",
		}),
	],
	templateUrl: "./equipments.component.html",
	styleUrls: ["./equipments.component.css"],
})
export class EquipmentsComponent implements OnInit, OnDestroy {
	@Input()
	public viewFocus: Observable<boolean>;
	private viewFocusSubscription: Subscription;

	@Input()
	public initialTabSelect = 1;

	public equipmentClasses: EquipmentClass[];
	public equipments: Equipment[];
	public filteredEquipmentClasses: EquipmentClass[];
	public filteredEquipments: Equipment[];

	public equipmentsWithoutClass: Equipment[];

	public selectedEquipmentClass?: EquipmentClass;
	public selectedEquipment?: Equipment;
	public selectedEquipmentActivitiesIds?: string[];
	public selectedEquipmentClassActivitiesIds?: string[];
	public selectedActivity?: ActivityDetails;

	public equipmentLocations: EquipmentLocationDetails[];

	public equipmentOrClassActivityAssociation: AssignEquipmentOrClassProcess;

	public classesFilterControl: FormControl = new FormControl();
	public equipmentsFilterControl: FormControl = new FormControl();

	private _onDestroyForClassesAndEquipmentsFilter = new Subject<void>();
	public activitiesTreeLoadingIndicator = false;

	public showAllEquipments: EquipmentClass = {
		id: "SHOW_ALL_EQUIPMENTS",
		hasEquipment: "false",
	};

	public equipmentsWithNoClass: EquipmentClass = {
		id: "EQUIPMENTS_WITH_NO_CLASS",
		hasEquipment: "false",
	};

	public activeTab = "Classes";

	public locationsColumns: string[] = ["name", "star"];
	public locationsDataSource: MatTableDataSource<EquipmentLocationDetails>;

	public useVeri95Equipments = false;

	constructor(
		private activitiesService: ActivitiesService,
		private equipmentService: EquipmentService,
		public dialog: MatDialog,
		public masterSettingsService: SettingsService
	) {}

	public ngOnInit() {
		this.viewFocusSubscription = this.viewFocus.subscribe((focused: boolean) => {
			if (focused && (this.selectedEquipmentClass || this.selectedEquipment)) {
				if (this.activeTab === "Classes" && this.selectedEquipmentClassActivitiesIds) {
					this.activitiesService.focusNodes(this.selectedEquipmentClassActivitiesIds);
				}
				if (this.activeTab === "Equipments" && this.selectedEquipmentActivitiesIds) {
					this.activitiesService.focusNodes(this.selectedEquipmentActivitiesIds);
				}
			}
		});

		this.equipmentService.equipmentsClass$.subscribe((classes) => {
			this.equipmentClasses = classes;
			this.filteredEquipmentClasses = classes;
			this.activitiesTreeLoadingIndicator = false;
		});

		this.selectedEquipmentClass = this.showAllEquipments;

		this.equipmentService.equipments$.subscribe((equipments) => {
			this.equipments = equipments;
			this.filteredEquipments = equipments;
			this.activitiesTreeLoadingIndicator = false;
		});

		this.equipmentService.equipmentsWithoutClass$.subscribe((equipments) => {
			this.equipmentsWithoutClass = equipments;
			this.activitiesTreeLoadingIndicator = false;
		});

		this.classesFilterControl.valueChanges
			.pipe(takeUntil(this._onDestroyForClassesAndEquipmentsFilter))
			.subscribe(() => {
				this.filterEquipmentClasses();
			});

		this.equipmentsFilterControl.valueChanges
			.pipe(takeUntil(this._onDestroyForClassesAndEquipmentsFilter))
			.subscribe(() => {
				this.filterEquipments();
			});

		this.masterSettingsService.masterdataSettings$.subscribe((currentSettings: Setting) => {
			this.useVeri95Equipments = currentSettings.useveri95Equipments;
		});
	}

	private filterEquipmentClasses() {
		let search = this.classesFilterControl.value;

		if (!search) {
			this.filteredEquipmentClasses = this.equipmentClasses.slice();
			return;
		} else {
			search = search.toLowerCase();
		}

		if (this.equipmentClasses) {
			this.filteredEquipmentClasses = this.equipmentClasses.filter((eqc) => {
				if (eqc.id && eqc.id.toLowerCase().indexOf(search) > -1) {
					return eqc;
				}
			});
		}
	}

	private filterEquipments() {
		let search = this.equipmentsFilterControl.value;

		if (!search) {
			this.filteredEquipments = this.equipments.slice();
			return;
		} else {
			search = search.toLowerCase();
		}

		if (this.equipments) {
			this.filteredEquipments = this.equipments.filter((eq) => {
				if (eq.id && eq.id.toLowerCase().indexOf(search) > -1) {
					return eq;
				}
			});
		}
	}

	public refreshTree(event: MatTabChangeEvent) {
		this.activitiesTreeLoadingIndicator = true;

		if (event.index === 0) {
			this.activitiesTreeLoadingIndicator = false;
			this.selectedActivity = undefined;
			this.activeTab = "Classes";
		}
		if (event.index === 1) {
			this.activitiesTreeLoadingIndicator = false;
			this.selectedActivity = undefined;
			this.activeTab = "Equipments";
		}
	}

	public async saveAssociation() {
		await this.createEquipmentIfNecessary();

		this.equipmentService
			.saveActivityAssociation(this.equipmentOrClassActivityAssociation)
			.subscribe(() => {
				this.selectedActivity = undefined;
				this.loadAssociatedActivities();
			});
	}

	private async createEquipmentIfNecessary() {
		if (this.activeTab === "Classes" && this.selectedEquipmentClass.hasEquipment !== "true") {
			await this.equipmentService
				.createEquipmentForIsa95EquipmentClass(this.selectedEquipmentClass.id)
				.toPromise();
			this.selectedEquipmentClass.hasEquipment = "true";
		} else if (
			this.activeTab === "Equipments" &&
			this.selectedEquipment.hasEquipment !== "true"
		) {
			await this.equipmentService
				.createEquipmentForIsa95Equipment(this.selectedEquipment.id)
				.toPromise();
			this.selectedEquipment.hasEquipment = "true";
		}
	}

	public removeAssociation() {
		if (confirm("Remove association? " + this.selectedActivity.names[0].name)) {
			this.equipmentService
				.removeActivityAssociation(
					+this.equipmentOrClassActivityAssociation.equipmentAssociationId
				)
				.subscribe(() => {
					this.loadAssociatedActivities();
					this.selectedActivity = undefined;
				});
		}
	}

	public async classSelectionChanged(event: any) {
		this.equipmentLocations = undefined;
		this.selectedActivity = undefined;
		this.selectedEquipment = undefined;

		if (this.useVeri95Equipments) {
			let equipmentsFilterByClass: Equipment[];

			if (event.value === this.showAllEquipments) {
				this.selectedEquipmentClass = this.showAllEquipments;
				this.equipmentService.sync();
			} else if (event.value === this.equipmentsWithNoClass) {
				this.selectedEquipmentClass = this.equipmentsWithNoClass;
				equipmentsFilterByClass = this.equipmentsWithoutClass;
			} else {
				this.loadAssociatedActivities();
				equipmentsFilterByClass = await this.equipmentService
					.getIsa95EquipmentsForClassId(this.selectedEquipmentClass.id)
					.toPromise();
			}

			this.equipments = equipmentsFilterByClass;
			this.filteredEquipments = equipmentsFilterByClass;
		} else {
			this.loadAssociatedActivities();
		}
	}

	public equipmentSelectionChanged(event: any) {
		this.equipmentLocations = undefined;
		this.selectedActivity = undefined;

		if (!this.useVeri95Equipments) {
			this.selectedEquipmentClass = undefined;
		}

		this.selectedEquipment = event.value;
		this.loadAssociatedActivities();
		this.loadEquipmentLocations();
	}

	private async loadEquipmentLocations() {
		let locations: EquipmentLocationDetails[] = [];

		if (this.selectedEquipment.hasEquipment === "true") {
			const id = this.selectedEquipment.id;
			const type = "EQUIPMENT";

			const details = await this.equipmentService.getDetails(type + "_" + id).toPromise();
			if (details) {
				locations = details.locations || [];
			} else {
				locations = [];
				this.selectedEquipment.hasEquipment = "false";
			}
		}

		this.equipmentLocations = locations;
		this.locationsDataSource = new MatTableDataSource(locations);
	}

	private async loadAssociatedActivities() {
		let id: string;
		let hasEquipment: string;

		if (this.activeTab === "Classes") {
			id = this.selectedEquipmentClass.id;
			hasEquipment = this.selectedEquipmentClass.hasEquipment;
		} else if (this.activeTab === "Equipments") {
			id = this.selectedEquipment.id;
			hasEquipment = this.selectedEquipment.hasEquipment;
		}

		if (
			this.selectedEquipment ||
			(this.selectedEquipmentClass !== this.showAllEquipments &&
				this.selectedEquipmentClass !== this.equipmentsWithNoClass)
		) {
			let associatedActivities = [];

			if (hasEquipment === "true" || hasEquipment === "1") { // fix for oracle not returning 1.0000000 and 0.000000 instead of true and false
				associatedActivities = await this.equipmentService
					.getActivitiesForEquipmentOrClass(id)
					.toPromise();
			}

			if (this.activeTab === "Classes") {
				this.selectedEquipmentClassActivitiesIds = associatedActivities.map(
					(a) => a.activityId
				);
			} else if (this.activeTab === "Equipments") {
				this.selectedEquipmentActivitiesIds = associatedActivities.map((a) => a.activityId);
			}
			this.activitiesService.focusNodes(associatedActivities.map((a) => a.activityId));
		}
	}

	public selectActivity(id: number) {
		if (this.selectedEquipmentClass || this.selectedEquipment) {
			this.activitiesService.getDetails(id).subscribe(
				(activity) => {
					let existingAssociation: string;
					this.equipmentOrClassActivityAssociation = new AssignEquipmentOrClassProcess();
					this.equipmentOrClassActivityAssociation.activityId = activity.activityId;

					if (this.activeTab === "Classes") {
						existingAssociation = this.selectedEquipmentClassActivitiesIds.find(
							(a) => +a === activity.activityId
						);
						this.equipmentOrClassActivityAssociation.equipmentId = {
							id: this.selectedEquipmentClass.id,
							type: "EQUIPMENTCLASS",
						};

						if (existingAssociation) {
							this.equipmentService
								.getAssociationByEquipmentIdAndActivityId(
									this.selectedEquipmentClass.id,
									+existingAssociation
								)
								.subscribe((association) => {
									this.equipmentOrClassActivityAssociation.fromApi(
										association[0].equipmentAssociation[0]
									);
								});
						}
					}

					if (this.activeTab === "Equipments") {
						existingAssociation = this.selectedEquipmentActivitiesIds.find(
							(a) => +a === activity.activityId
						);
						this.equipmentOrClassActivityAssociation.equipmentId = {
							id: this.selectedEquipment.id,
							type: "EQUIPMENT",
						};

						if (existingAssociation) {
							this.equipmentService
								.getAssociationByEquipmentIdAndActivityId(
									this.selectedEquipment.id,
									+existingAssociation
								)
								.subscribe((association) => {
									this.equipmentOrClassActivityAssociation.fromApi(
										association[0].equipmentAssociation[0]
									);
								});
						}
					}

					this.selectedActivity = activity;
				},
				() => undefined
			);
		}
	}

	public async addNewLocation() {
		await this.createEquipmentIfNecessary();

		const equipmentLocationProcess: EquipmentLocationProcess = {
			equipmentId: { id: this.selectedEquipment.id, type: "EQUIPMENT" },
			locationId: undefined,
			names: [],
		};

		this.localizationModal(equipmentLocationProcess);
	}

	public editLocation(locationDetails: EquipmentLocationDetails) {
		const equipmentLocationProcess: EquipmentLocationProcess = {
			equipmentId: { id: this.selectedEquipment.id, type: "EQUIPMENT" },
			locationId: "" + locationDetails.locationId,
			names: locationDetails.names,
		};

		this.localizationModal(equipmentLocationProcess);
	}

	private localizationModal(locationProcess: EquipmentLocationProcess) {
		const data: LocalizationModalConfig = {
			data: locationProcess.names,
			subjectTitle: "location",
		};
		const dialogRef = this.dialog.open(LocalizationModalComponent, {
			width: "650px",
			data,
		});

		dialogRef.afterClosed().subscribe((model) => {
			if (model) {
				locationProcess.names = model.data;
				this.equipmentService.saveLocation(locationProcess).subscribe(() => {
					this.loadEquipmentLocations();
				});
			}
		});
	}

	public deleteLocation(location: EquipmentLocationDetails) {
		if (confirm("Delete location? " + location.names[0].name)) {
			this.equipmentService.removeLocation(location.locationId).subscribe(() => {
				this.loadAssociatedActivities();
			});
		}
	}

	public addDowntimesEquipmentClass() {
		this.equipmentOrClassModal(AddEquipmentClassModalComponent);
	}

	public addDowntimesEquipment() {
		this.equipmentOrClassModal(AddEquipmentModalComponent);
	}

	private equipmentOrClassModal(modalToshow: any) {
		const dialogRef = this.dialog.open(modalToshow, {
			width: "650px",
		});
		dialogRef.afterClosed().subscribe((model: EquipmentOrClassProcess) => {
			if (model) {
				this.equipmentService.addEquipmentOrClass(model).subscribe(() => {
					this.equipmentService.sync();
				});
			}
		});
	}

	public ngOnDestroy() {
		this.viewFocusSubscription.unsubscribe();
	}
}
