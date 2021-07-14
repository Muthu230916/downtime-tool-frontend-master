import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { DowntimesService } from "../core/services/downtimes.service";
import { Subscription, Observable, of } from "rxjs";
import { map, startWith, switchMap, catchError } from "rxjs/operators";
import { Downtime, ShowDowntimeItem } from "../core/models/queries/downtime.model";
import { trigger, state, transition, style, animate } from "@angular/animations";
import { MatDialog } from "@angular/material";
import { DeclareDowntimeModalComponent } from "./declare-downtime-modal/declare-downtime-modal.component";
import { Activity } from "../core/models/queries/activity.model";
import { DowntimeProcess } from "../core/models/process/downtime.process.model";
import { SplitDowntimeModalComponent } from "./split-downtime-modal/split-downtime-modal.component";
import { EquipmentService } from "../core/services/equipment.service";
import { ActivatedRoute, Router, Params } from "@angular/router";
import { ApplicationService } from "@movilitas/mov-base";

@Component({
	selector: "lib-downtimes-downtimes-registration",
	templateUrl: "./downtimes-registration.component.html",
	styleUrls: ["./downtimes-registration.component.css"],
	animations: [
		trigger("detailExpand", [
			state("collapsed", style({ height: "0px", minHeight: "0" })),
			state("expanded", style({ height: "*" })),
			transition("expanded <=> collapsed", animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")),
		]),
	],
})
export class DowntimesRegistrationComponent implements OnInit, OnDestroy, AfterViewInit {
	private linesSubscription: Subscription;
	private downtimeSubscription: Subscription;
	public resultsLength = 0;
	public isLoadingResults = true;
	public isRateLimitReached = false;
	public downtimeDatabase?: DowntimeRequests;
	public data: ShowDowntimeItem[] = [];
	public lines = [];
	public selectedLines!: string[];
	public expandedDowntime: ShowDowntimeItem | null;
	public activitiesForEquipment: Map<string, Activity[]> = new Map();
	private undeclareSubscription: Subscription;
	private modalSubscription: Subscription;
	public isLineSetFromUrl = false;
	public searchEquipmentClass = '';

	displayedColumns: string[] = [
		"ID",
		"WorkCenter",
		"Batch",
		"Order",
		"Activity",
		"Duration",
		"Start",
		"Stop",
		"Team",
	];

	@ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

	public ELEMENT_DATA: ShowDowntimeItem[] = [];
	public dataSource?: MatTableDataSource<ShowDowntimeItem>;

	constructor(
		private downtimesService: DowntimesService,
		public dialog: MatDialog,
		private equipmentService: EquipmentService,
		private route: ActivatedRoute,
		private router: Router,
		private application: ApplicationService
	) {
		this.application.subTitle = "Registration";
	}

	ngOnInit() {
		const urlLines = this.route.snapshot.queryParamMap.get("line");

		if (urlLines) {
			this.selectedLines = urlLines.split(",");
			this.isLineSetFromUrl = true;
		} else {
			this.isLineSetFromUrl = false;
		}

		this.linesSubscription = this.equipmentService.downtimesEquipments$.subscribe((de) => {
			this.lines = de;
			if (de.length > 0) {
				this.setDowntimes();
			}
		});
	}

	ngAfterViewInit() {
		this.equipmentService.getEqupimentsInDowntimes();
		// this.setDowntimes();
	}

	public setDowntimes() {
		if (this.downtimeSubscription) {
			this.downtimeSubscription.unsubscribe();
		}

		if (!this.selectedLines || this.selectedLines.length < 1) {
			return;
		}

		if (this.expandedDowntime) {
			this.expandedDowntime = undefined;
		}

		const linesReq = this.selectedLines.length > 0 ? this.selectedLines : ["-1"];

		// tslint:disable-next-line: no-use-before-declare
		this.downtimeDatabase = new DowntimeRequests(this.downtimesService, linesReq);
		this.downtimeSubscription = this.paginator.page
			.pipe(
				startWith({}),
				switchMap(() => {
					this.isLoadingResults = true;
					// tslint:disable-next-line: no-non-null-assertion
					return this.downtimeDatabase.getDowntimes(
						this.paginator.pageIndex,
						this.paginator.pageSize
					);
				}),
				map(async (dataAsync) => {
					let data;
					await dataAsync.toPromise().then((d) => {
						this.isLoadingResults = false;
						this.isRateLimitReached = false;
						this.resultsLength = d.totalCount;
						data = d;
					});

					return data.itemsToShow;
				}),
				catchError((err) => {
					console.log(err);
					this.isLoadingResults = false;
					this.isRateLimitReached = true;
					return of([]);
				})
			)
			.subscribe(async (data) => {
				this.activitiesForEquipment.clear();
				for (const line of this.selectedLines) {
					this.activitiesForEquipment.set(
						line,
						this.equipmentService.getActivitiesForEquipment(line)
					);
				}

				await (data as Promise<any>).then((d) => {
					this.data = d;
				});
			});
	}

	ngOnDestroy() {
		if (this.downtimeSubscription) {
			this.downtimeSubscription.unsubscribe();
		}

		this.linesSubscription.unsubscribe();

		if (this.undeclareSubscription) {
			this.undeclareSubscription.unsubscribe();
		}

		if (this.modalSubscription) {
			this.modalSubscription.unsubscribe();
		}
	}

	public onSelectChange() {
		const selectedLinesStr = this.selectedLines.join(",");
		const queryParams: Params = { line: selectedLinesStr };

		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: queryParams,
			queryParamsHandling: "merge", // remove to replace all query params by provided
		});
		this.setDowntimes();
	}

	public declare(downtime: ShowDowntimeItem) {
		const modal = this.dialog.open(DeclareDowntimeModalComponent, {
			width: "70%",
			data: { downtime },
		});

		if (this.modalSubscription) {
			this.modalSubscription.unsubscribe();
		}

		this.modalSubscription = modal.afterClosed().subscribe((r) => {
			if (r && r.messageType === "Success") {
				this.setDowntimes();
			}
		});
	}

	public undeclare() {
		const undeclareDowntime = new DowntimeProcess();
		undeclareDowntime.downtimeId = this.expandedDowntime.ID;
		undeclareDowntime.duration = this.expandedDowntime.durationSeconds;
		undeclareDowntime.startTime = this.expandedDowntime.Start;
		undeclareDowntime.endTime = this.expandedDowntime.Stop;
		undeclareDowntime.equipmentId = {
			id: this.expandedDowntime.WorkCenter,
			type: "EQUIPMENT",
		};

		this.undeclareSubscription = this.downtimesService
			.updateDowntime(undeclareDowntime)
			.subscribe(() => this.setDowntimes());
	}

	public split(downtime: ShowDowntimeItem) {
		const modal = this.dialog.open(SplitDowntimeModalComponent, {
			width: "70%",
			data: { downtime },
		});

		if (this.modalSubscription) {
			this.modalSubscription.unsubscribe();
		}

		this.modalSubscription = modal.afterClosed().subscribe((r) => {
			if (r) {
				this.setDowntimes();
			}
		});
	}
}

export class DowntimeRequests {
	private lines: string[];
	private offset = 0;

	constructor(private downtimesService: DowntimesService, lines: string[]) {
		this.lines = lines;
	}

	async getDowntimes(pageIdx: number, limit: number): Promise<Observable<Downtime>> {
		this.offset = pageIdx * limit;

		return await this.downtimesService.getByLine(
			this.lines,
			undefined,
			undefined,
			this.offset,
			limit
		);
	}
}
