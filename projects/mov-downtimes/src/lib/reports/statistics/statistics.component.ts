import moment from "moment";
import { Component, ElementRef, OnDestroy } from "@angular/core";
import {
	StatisticsContainerModel,
	StatisticsModel
} from "../../core/models/queries/statistics-container.model";
import { ReportsService } from "../../core/services/reports.service";
import { MatDialog } from "@angular/material/dialog";
import { ViewsModalComponent } from "./views/views-modal.component";
import {
	fadeOutUpOnLeaveAnimation,
	fadeInUpOnEnterAnimation,
	fadeInDownOnEnterAnimation
} from "angular-animations";
import { SaveViewModalComponent } from "./save-view/save-view-modal.component";

@Component({
	selector: "lib-downtimes-reports-statistics",
	animations: [
		fadeInUpOnEnterAnimation({ anchor: "enter", duration: 500, delay: 0, translate: "30px" }),
		fadeOutUpOnLeaveAnimation({ anchor: "leave", duration: 500, delay: 0, translate: "30px" }),
		fadeInDownOnEnterAnimation({
			anchor: "downEnter",
			duration: 500,
			delay: 0,
			translate: "30px"
		})
	],
	templateUrl: "./statistics.component.html",
	styleUrls: ["./statistics.component.css"]
})
export class ReportsStatisticsComponent implements OnDestroy {
	public containerToScroll: ElementRef;

	public statistics: StatisticsContainerModel = new StatisticsContainerModel();

	constructor(private reportsService: ReportsService, public dialog: MatDialog) {
		if (this.statistics.gauges.length === 0) {
			this.statistics.gauges.push(this.getEmptyModel());
		}
	}

	private getEmptyModel() {
		const startOfToday = moment().startOf("day");
		const endOfToday = moment().endOf("day");

		const emptyStatisticsModel: StatisticsModel = {
			selection: {
				dateFrom: startOfToday.toISOString(),
				dateTo: endOfToday.toISOString(),
				equipments: [],
				activity: "",
				timeFilterType: "DATE"
			}
		};

		return emptyStatisticsModel;
	}

	public addNewGauge() {
		this.statistics.gauges.push(this.getEmptyModel());
		this.scrollToBottom();
	}

	private scrollToBottom() {
		setTimeout(() => {
			const objDiv = document.getElementsByClassName("mat-tab-body-content")[1];
			if (objDiv) {
				objDiv.scrollTop = objDiv.scrollHeight;
			}
		}, 100);
	}

	public removeGauge(gauge: StatisticsModel) {
		this.statistics.gauges.splice(this.statistics.gauges.indexOf(gauge), 1);
	}

	public cloneGauge(gauge: StatisticsModel) {
		this.statistics.gauges.push(gauge);
	}

	public saveStatisticsView() {
		this.saveViewModal();
	}

	public saveExistingAsNewStatisticsView() {
		this.saveViewModal(true);
	}

	public viewsModal() {
		const dialogRef = this.dialog.open(ViewsModalComponent, {
			width: "650px"
		});
		dialogRef.afterClosed().subscribe(model => {
			if (model) {
				if (model.contentJson !== "") {
					this.statistics = model;
					this.statistics.gauges = [];
					this.reportsService.getViewGauges(this.statistics.uiid).subscribe(gauges => {
						if (gauges.length > 0) {
							this.statistics.gauges = gauges[0];
						}
					});
				}
			}
		});
	}

	public clearViewSelection() {
		this.statistics = new StatisticsContainerModel();
		this.statistics.gauges.push(this.getEmptyModel());
	}

	private saveViewModal(saveExistingAsNew?: boolean) {
		const dialogRef = this.dialog.open(SaveViewModalComponent, {
			width: "650px"
		});
		dialogRef.afterClosed().subscribe(model => {
			if (model) {
				if (saveExistingAsNew) {
					this.statistics.uiid = undefined;
				}
				this.statistics.name = model.name;
				this.statistics.shared = model.shared;
				this.statistics.type = "STATISTICS";
				this.reportsService.saveView(this.statistics).subscribe();
			}
		});
	}

	public updateView() {
		this.reportsService.saveView(this.statistics).subscribe();
	}

	public calculateAll() {
		this.reportsService.calculateAllCharts();
	}

	public ngOnDestroy() {}
}
