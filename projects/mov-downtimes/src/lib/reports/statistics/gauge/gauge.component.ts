import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from "@angular/core";
import { EquipmentService } from "../../../core/services/equipment.service";
import { ReportsService } from "../../../core/services/reports.service";
import { Equipment } from "../../../core/models/queries/equipment.model";
import { Observable, Subscription } from "rxjs";
import { FormControl } from "@angular/forms";
import { startWith, map } from "rxjs/operators";
import { ReportsSearchModel } from "../../../core/models/reports-search.model";
import { fadeInLeftBigOnEnterAnimation, fadeOutLeftBigOnLeaveAnimation } from "angular-animations";
import { ShowDowntimeItem } from "../../../core/models/queries/downtime.model";
import moment from "moment";
import { StatisticsModel } from "../../../core/models/queries/statistics-container.model";
import { Activity } from "../../../core/models/queries/activity.model";
import { ActivitiesService } from "../../../core/services/activities.service";
import { GaugeDataService, GaugeData, GaugeDataEntry } from "./gauge-data.service";
import { MatDialog } from "@angular/material/dialog";
import { DateTimeService } from "../../../core/services/date-time.service";
import { LanguageCodes } from "../../../core/enums/language-codes.enum";

@Component({
	selector: "lib-downtimes-gauge",
	animations: [
		fadeInLeftBigOnEnterAnimation({
			anchor: "enter",
			duration: 500,
			delay: 0,
			translate: "30px",
		}),
		fadeOutLeftBigOnLeaveAnimation({
			anchor: "leave",
			duration: 500,
			delay: 0,
			translate: "30px",
		}),
	],
	templateUrl: "./gauge.component.html",
	styleUrls: ["./gauge.component.css"],
})
export class GaugeComponent implements OnInit, OnDestroy {
	@Input()
	public model: StatisticsModel;

	@Output()
	public removeGauge = new EventEmitter<StatisticsModel>();

	@Output()
	public cloneGauge = new EventEmitter<StatisticsModel>();

	public activities: Activity[] = [];

	public filteredEquipments: Equipment[] = [];
	public filteredEquipments$: Observable<Equipment[]>;
	public equipmentsSelectionControl = new FormControl();
	public equipments: Equipment[] = [];
	private equipmentsSubscription: Subscription;

	public selectedEquipments: Equipment[] = [];

	public downtimes: ShowDowntimeItem[];
	public calculatedGaugeData: GaugeData;
	public activityColors: { name: string; value: string }[] = [];

	public view: any[] = [320, 320];
	public tooltipMode: "percentage" | "duration" = "percentage";
	public useActivityColors = false;
	public showLegend = true;

	public configMode = true;
	private calculateTriggerSubscription: Subscription;

	constructor(
		private equipmentService: EquipmentService,
		private activiesService: ActivitiesService,
		private reportsService: ReportsService,
		private gaugeDataService: GaugeDataService,
		public dialog: MatDialog,
		private dateTimeService: DateTimeService
	) {}

	public ngOnInit() {
		this.equipmentsSubscription = this.equipmentService.downtimesEquipments$.subscribe(
			(equipments) => {
				if (equipments.length > 0) {
					equipments.map((eq) => this.equipments.push({ id: eq }));
					equipments.map((eq) => this.filteredEquipments.push({ id: eq }));
					const selectedEquipments = equipments.filter((eq) =>
						this.model.selection.equipments.includes(eq)
					);
					selectedEquipments.map((eq) => this.selectedEquipments.push({ id: eq }));
				}
			}
		);

		this.filteredEquipments$ = this.equipmentsSelectionControl.valueChanges.pipe(
			// tslint:disable-next-line: deprecation
			startWith(null),
			map((word: string | null) =>
				word ? this._filterEquipments(word) : this.equipments.slice()
			)
		);

		this.calculateTriggerSubscription = this.reportsService.calculateAllCharts$.subscribe(
			() => {
				this.getAnalytics();
			}
		);

		this.activiesService
			.getAll(LanguageCodes.English)
			.subscribe((activities) => (this.activities = activities));
	}

	private _filterEquipments(value: any) {
		if (!(value instanceof Object)) {
			const filterValue = value.toLowerCase();
			return this.equipments.filter((eq) => {
				if (eq.id && eq.id.toLowerCase().indexOf(filterValue) === 0) {
					return eq;
				}
			});
		}
	}

	public back() {
		const selectedActivityId = this.model.selection.activity;

		if (!selectedActivityId) {
			this.configMode = true;
		} else if (selectedActivityId === "ROOT") {
			this.model.selection.activity = "";
			this.recalculate();
		} else {
			const selectedActivity = this.activities.find((act) => act.uiid === selectedActivityId);
			const parentActivity = selectedActivity.parentActivity;

			if (parentActivity === "") {
				this.model.selection.activity = "ROOT";
			} else {
				this.model.selection.activity = parentActivity;
			}

			this.recalculate();
		}
	}

	public addEquipmentToSelection(event: any) {
		const equipmentSeletionExists = this.selectedEquipments.find(
			(eq) => eq.id === event.value.id
		);
		if (!equipmentSeletionExists) {
			this.selectedEquipments.push(event.value);
			this.model.selection.equipments.push(event.value.id);
			this.equipmentsSelectionControl.setValue("");
			this.equipments = this.equipments.filter((e) => !this.selectedEquipments.includes(e));
		}
		this.equipmentsSelectionControl.disable();
		this.equipmentsSelectionControl.enable();
	}

	public removeEquipmentFromSelection(equipment: Equipment) {
		this.selectedEquipments = this.selectedEquipments.filter((eq) => eq.id !== equipment.id);
		this.model.selection.equipments = this.model.selection.equipments.filter(
			(eq) => eq !== equipment.id
		);
		this.equipments.push(equipment);
	}

	public getAnalytics() {
		if (this.model.selection.dynamicDaily) {
			this.setPeriodWithTodayAsEndDate(1);
		}

		if (this.model.selection.dynamicWeekly) {
			this.setPeriodWithTodayAsEndDate(7);
		}

		const readyForCalculation =
			this.selectedEquipments.length > 0 &&
			this.model.selection.dateFrom &&
			this.model.selection.dateTo;

		if (readyForCalculation) {
			this.reportsService
				.getAll(LanguageCodes.English, this.getSearchModel(), 0, 0)
				.subscribe((downtimes) => {
					this.downtimes = downtimes;
					this.recalculate();
					this.configMode = false;
				});
		}
	}

	private getSearchModel() {
		const searchModel = new ReportsSearchModel();
		searchModel.from = new Date(this.model.selection.dateFrom);
		searchModel.to = new Date(this.model.selection.dateTo);
		searchModel.equipmentsSelected = this.selectedEquipments;
		return searchModel;
	}

	private recalculate() {
		this.calculatedGaugeData = this.gaugeDataService.getGaugeData(
			this.model,
			this.downtimes,
			this.activities
		);

		this.activityColors = this.calculatedGaugeData.entries
			.filter((entry) => entry.extra && entry.extra.activity)
			.map((entry) => ({
				name: entry.name,
				value: entry.extra.activity.color,
			}));
	}

	public onSegmentClicked(event: GaugeDataEntry) {
		if (event.extra && event.extra.isTotalDowntime) {
			this.model.selection.activity = "ROOT";
			this.recalculate();
		} else if (event.extra && event.extra.activity) {
			const clickedActivityId = event.extra.activity.id;
			const hasChildren = this.activities.some(
				(act) => act.parentActivity === clickedActivityId
			);

			if (hasChildren) {
				this.model.selection.activity = clickedActivityId;
				this.recalculate();
			}
		}
	}

	public removeGaugeAction() {
		if (confirm("Remove statistics widget?")) {
			this.removeGauge.emit(this.model);
		}
	}

	public transformTooltipValue(rawValue: number) {
		if (this.tooltipMode === "percentage") {
			const percentage = (100 * rawValue) / this.calculatedGaugeData.totalValue;
			return `${percentage.toFixed(2)}%`;
		} else {
			const momentDuration = moment.duration(rawValue, "seconds");
			return this.dateTimeService.toDurationString(momentDuration);
		}
	}

	public showInDataTab() {
		this.reportsService.setSearchModel(this.getSearchModel());
	}

	public clone() {
		this.cloneGauge.emit(this.model);
	}

	public dynamicDaily() {
		this.model.selection.dynamicWeekly = false;

		if (this.model.selection.dynamicDaily) {
			this.model.selection.dynamicDaily = !this.model.selection.dynamicDaily;
		} else {
			this.model.selection.dynamicDaily = true;
		}

		this.setPeriodWithTodayAsEndDate(1);
	}

	public dynamicWeekly() {
		this.model.selection.dynamicDaily = false;

		if (this.model.selection.dynamicWeekly) {
			this.model.selection.dynamicWeekly = !this.model.selection.dynamicWeekly;
		} else {
			this.model.selection.dynamicWeekly = true;
		}

		this.setPeriodWithTodayAsEndDate(7);
	}
	private setPeriodWithTodayAsEndDate(daysToRemove: number) {
		const fromDate = new Date(new Date().setDate(new Date().getDate() - daysToRemove));
		fromDate.setHours(0, 0, 0);
		this.model.selection.dateFrom = fromDate.toISOString();

		const toDate = new Date();
		toDate.setHours(23, 59, 59);
		this.model.selection.dateTo = toDate.toISOString();
	}

	public ngOnDestroy() {
		this.equipmentsSubscription.unsubscribe();
		this.calculateTriggerSubscription.unsubscribe();
	}
}
