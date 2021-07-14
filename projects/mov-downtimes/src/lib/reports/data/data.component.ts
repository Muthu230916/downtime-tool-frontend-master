import moment from "moment";
import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Equipment } from "../../core/models/queries/equipment.model";
import { FormControl } from "@angular/forms";
import { startWith, map } from "rxjs/operators";
import { Subject, Subscription, Observable } from "rxjs";
import { EquipmentService } from "../../core/services/equipment.service";
import { ReportsSearchModel } from "../../core/models/reports-search.model";

import { DowntimeRequests } from "../../downtimes-registration/downtimes-registration.component";
import { ShowDowntimeItem } from "../../core/models/queries/downtime.model";
import { Activity } from "../../core/models/queries/activity.model";
import { MatPaginator, MatTableDataSource } from "@angular/material";
import { ReportsService } from "../../core/services/reports.service";
import {
	fadeInLeftBigOnEnterAnimation,
	fadeOutUpOnLeaveAnimation,
	fadeInDownOnEnterAnimation,
} from "angular-animations";
import { LanguageCodes } from "../../core/enums/language-codes.enum";

@Component({
	selector: "lib-downtimes-reports-data",
	animations: [
		fadeInLeftBigOnEnterAnimation({
			anchor: "enter",
			duration: 500,
			delay: 10,
			translate: "30px",
		}),
		fadeOutUpOnLeaveAnimation({ anchor: "leave", duration: 500, delay: 0, translate: "30px" }),
		fadeInDownOnEnterAnimation({
			anchor: "downEnter",
			duration: 500,
			delay: 0,
			translate: "30px",
		}),
	],
	templateUrl: "./data.component.html",
	styleUrls: ["./data.component.css"],
})
export class ReportsDataComponent implements OnInit, OnDestroy {
	public filteredEquipments: Equipment[] = [];
	public filteredEquipments$: Observable<Equipment[]>;
	public equipmentsSelectionControl = new FormControl();

	public equipments: Equipment[] = [];

	private _onDestroyForClassesAndEquipmentsFilter = new Subject<void>();
	private equipmentsSubscription: Subscription;

	public searchModel: ReportsSearchModel;
	public totalCount: number;
	public totalResultsCount: number;

	// table properties -----------------------------------------
	public resultsLength = 0;
	public isLoadingResults = true;
	public isRateLimitReached = false;
	public downtimeDatabase?: DowntimeRequests;

	public results: ShowDowntimeItem[];
	public lines = [];
	public selectedLines!: string[];
	public expandedDowntime: ShowDowntimeItem | null;
	public activitiesForEquipment: Map<string, Activity[]> = new Map();
	public displayedColumns: string[] = [
		"ID",
		"WorkCenter",
		"Batch",
		"Order",
		"Activity",
		"Duration",
		"Start",
		"Stop",
		"Team",
		"User",
	];

	@ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
	private paginatorSubscription: Subscription;

	public ELEMENT_DATA: ShowDowntimeItem[] = [];
	public dataSource?: MatTableDataSource<ShowDowntimeItem>;
	private searchModelSubscription: Subscription;

	// ----------------------------------------------------------

	constructor(
		private equipmentService: EquipmentService,
		private reportsService: ReportsService
	) {}

	public ngOnInit() {
		this.equipmentService.getEqupimentsInDowntimes();

		this.equipmentsSubscription = this.equipmentService.downtimesEquipments$.subscribe(
			(equipments) => {
				if (equipments.length > 0) {
					equipments.map((eq) => this.equipments.push({ id: eq }));
					equipments.map((eq) => this.filteredEquipments.push({ id: eq }));
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

		this.searchModelSubscription = this.reportsService.searchModel$.subscribe(
			(newSearchModel) => {
				this.searchModel = newSearchModel;
				this.resetResults();
			}
		);
	}

	private _filterEquipments(value: any) {
		if (!(value instanceof Object)) {
			const filterValue = value.toLowerCase();
			return this.filteredEquipments.filter((eq) => {
				if (eq.id && eq.id.toLowerCase().indexOf(filterValue) === 0) {
					return eq;
				}
			});
		}
	}

	public addEquipmentToSelection(event: any) {
		const equipmentSeletionExists = this.searchModel.equipmentsSelected.find(
			(eq) => eq.id === event.value.id
		);
		if (!equipmentSeletionExists) {
			this.resetResults();
			this.searchModel.equipmentsSelected.push(event.value);
			this.equipmentsSelectionControl.setValue("");
			this.equipments = this.equipments.filter(
				(e) => !this.searchModel.equipmentsSelected.includes(e)
			);
		}
		this.equipmentsSelectionControl.disable();
		this.equipmentsSelectionControl.enable();
	}

	public removeEquipmentFromSelection(equipment: Equipment) {
		this.searchModel.equipmentsSelected = this.searchModel.equipmentsSelected.filter(
			(eq) => eq.id !== equipment.id
		);
		this.equipments.push(equipment);
		this.resetResults();
	}

	public ngOnDestroy() {
		this.equipmentsSubscription.unsubscribe();
		this._onDestroyForClassesAndEquipmentsFilter.unsubscribe();
	}

	public getAnalytics() {
		this.resetResults();
		this.reportsService
			.getTotalCount(LanguageCodes.English, this.searchModel)
			.subscribe((results) => {
				if (results instanceof Array && results[0].totalCount) {
					this.totalCount = results[0].totalCount;
					this.totalResultsCount = results[0].totalCount;
				} else {
					this.totalCount = 0;
					this.totalResultsCount = 0;
				}
			});
	}

	public getActualData() {
		this.totalCount = undefined;
		this.dataRetreiver(0, 5);
	}

	private dataRetreiver(offset = 0, limit = 0) {
		this.reportsService
			.getAll(LanguageCodes.English, this.searchModel, offset, limit)
			.subscribe((results) => {
				this.results = results;

				if (this.paginatorSubscription) {
					this.paginatorSubscription.unsubscribe();
				}

				this.paginatorSubscription = this.paginator.page.subscribe((event) => {
					this.dataRetreiver(this.paginator.pageIndex, this.paginator.pageSize);
				});
			});
	}

	private resetResults() {
		this.totalCount = undefined;
		this.results = undefined;
		this.totalResultsCount = undefined;
		this.resultsLength = 0;
	}

	public slideFilterValue(
		value: boolean,
		type: "all" | "declared" | "undeclared" | "ongoing" | "showshortstop"
	) {
		if (value && type === "all") {
			this.searchModel.showDeclared = false;
			this.searchModel.showUndeclared = false;
			this.searchModel.showOngoing = false;
			this.resetResults();
		} else if (value && type !== "all" && type !== "showshortstop") {
			this.searchModel.showAll = false;
			this.resetResults();
		} else if (
			!value &&
			type === "all" &&
			!this.searchModel.showDeclared &&
			!this.searchModel.showUndeclared &&
			!this.searchModel.showOngoing
		) {
			setTimeout(() => {
				this.searchModel.showAll = true;
			}, 200);
		} else if (type === "showshortstop") {
			this.resetResults();
		}
	}

	public toCSV() {
		this.reportsService
			.getAll(LanguageCodes.English, this.searchModel, 0, this.totalResultsCount)
			.subscribe((results) => {
				const items = results;
				const separator = ",";

				if (!items.length) {
					return "";
				}

				const columns = Object.keys(items[0]).join(separator);
				const body = items.map((item) => Object.values(item).join(separator)).join("\n");

				const csv = columns + "\n" + body;
				const fileName =
					moment(this.searchModel.from).format("dddMMMYY") +
					"-" +
					moment(this.searchModel.to).format("dddMMMYY") +
					".csv";

				const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
				if (navigator.msSaveBlob) {
					// IE 10+
					navigator.msSaveBlob(blob, fileName);
				} else {
					const link = document.createElement("a");
					if (link.download !== undefined) {
						const url = URL.createObjectURL(blob);
						link.setAttribute("href", url);
						link.setAttribute("download", fileName);
						link.style.visibility = "hidden";
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
					}
				}
			});
	}

	public OnDestroy() {
		if (this.paginatorSubscription) {
			this.paginatorSubscription.unsubscribe();
		}
		this.searchModelSubscription.unsubscribe();
	}
}
