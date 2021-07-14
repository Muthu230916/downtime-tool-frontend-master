import { Component, OnInit } from "@angular/core";
import { ActivitiesService } from "../../core/services/activities.service";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { Subject } from "rxjs";
import { ApplicationService } from "@movilitas/mov-base";

@Component({
	selector: "lib-downtimes-overview",
	templateUrl: "./overview.component.html",
	styleUrls: ["./overview.component.css"]
})
export class OverviewComponent implements OnInit {
	constructor(
		private activitiesService: ActivitiesService,
		private application: ApplicationService
	) {
		this.application.subTitle = "Masterdata";
	}

	private equipmentsFocusSubject = new Subject<boolean>();
	public equipmentsFocus$ = this.equipmentsFocusSubject.asObservable();

	public tabSelectForEquipments = 1;

	public ngOnInit() {
		this.activitiesService.refreshTree();
	}

	public refreshComponents(event: MatTabChangeEvent) {
		if (event.index === 0) {
			this.activitiesService.clearFocus();
			this.activitiesService.refreshTree();
		}

		if (event.index === 1) {
			this.equipmentsFocusSubject.next(true);
			setTimeout(() => {
				this.tabSelectForEquipments = 0;
			}, 200);
		}
	}
}
