import moment from "moment";

import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { ShowDowntimeItem } from "../../core/models/queries/downtime.model";
import { DowntimesService } from "../../core/services/downtimes.service";
import { DowntimeProcess } from "../../core/models/process/downtime.process.model";
import { forkJoin, Subscription } from "rxjs";

@Component({
	selector: "lib-downtimes-split-downtime-modal",
	templateUrl: "./split-downtime-modal.component.html",
	styleUrls: ["./split-downtime-modal.component.css"]
})
export class SplitDowntimeModalComponent implements OnInit, OnDestroy {
	public showPicker = false;
	public activeSplitPeriod: DowntimePeriod;
	public selectedDowntimeIdx?: number;
	private newDowntimesSubsription: Subscription;
	public downtimesPeriodToShow: DowntimePeriod[] = [];
	public selectedDate: Date;

	constructor(
		public dialogRef: MatDialogRef<SplitDowntimeModalComponent>,
		@Inject(MAT_DIALOG_DATA) public data: DialogData,
		private downtimesService: DowntimesService
	) {}

	ngOnInit() {
		this.showPicker = false;
		const startISO = moment(this.data.downtime.Start).toISOString();
		const endISO = moment(this.data.downtime.Stop).toISOString();

		this.downtimesPeriodToShow.push({
			start: startISO,
			end: endISO
		});
	}

	public prepareSplit(downtimePeriod: DowntimePeriod) {
		this.activeSplitPeriod = downtimePeriod;

		this.selectedDowntimeIdx = this.downtimesPeriodToShow.findIndex(
			d => d === this.activeSplitPeriod
		);

		this.showPicker = true;
	}

	public cancelSplit() {
		this.selectedDowntimeIdx = undefined;
		this.showPicker = false;
	}

	public split() {
		const borderDateTime = this.selectedDate.toISOString();

		const checkTime = moment(borderDateTime).isBetween(
			this.activeSplitPeriod.start,
			this.activeSplitPeriod.end
		);

		if (!checkTime) {
			return;
		}
		const endTime = this.activeSplitPeriod.end;

		const dt = this.downtimesPeriodToShow.find(
			d => d.start === this.activeSplitPeriod.start && d.end === this.activeSplitPeriod.end
		);

		if (dt) {
			dt.end = borderDateTime;

			const newPeriod: DowntimePeriod = {
				start: borderDateTime,
				end: endTime
			};

			this.downtimesPeriodToShow.push(newPeriod);
		}

		this.selectedDowntimeIdx = undefined;
		this.showPicker = false;
	}

	public save() {
		const downtimesToSend = [];

		for (let i = 0; i < this.downtimesPeriodToShow.length; i++) {
			const newDowntime: DowntimeProcess = {
				endTime: this.downtimesPeriodToShow[i].end,
				startTime: this.downtimesPeriodToShow[i].start,
				isSplit: "true",
				equipmentId: { id: this.data.downtime.WorkCenter, type: "EQUIPMENT" }
			};

			if (+i === 0) {
				newDowntime.activityId = this.data.downtime.activityId;
				// newDowntime.comment = this.data.downtime.comment;
				newDowntime.downtimeId = this.data.downtime.ID;

				if (this.data.downtime.causeId) {
					newDowntime.cause = { causeId: this.data.downtime.causeId };
				}

				if (this.data.downtime.solutionId) {
					newDowntime.solution = { solutionId: this.data.downtime.solutionId };
				}

				if (this.data.downtime.teamId) {
					newDowntime.team = { teamId: this.data.downtime.teamId };
				}
			}

			downtimesToSend.push(this.downtimesService.declareDowntime(newDowntime));
		}

		this.newDowntimesSubsription = forkJoin(downtimesToSend).subscribe(
			nd => {
				this.dialogRef.close(nd);
			},
			() => this.dialogRef.close()
		);
	}

	public ngOnDestroy() {
		if (this.newDowntimesSubsription) {
			this.newDowntimesSubsription.unsubscribe();
		}
	}
}

interface DialogData {
	downtime: ShowDowntimeItem;
}

interface DowntimePeriod {
	start: string;
	end: string;
}
