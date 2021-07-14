import { Component, OnInit } from "@angular/core";
import { ReportsService } from "../core/services/reports.service";
import { Subscription } from "rxjs";
import { ApplicationService } from "@movilitas/mov-base";

@Component({
	selector: "lib-downtimes-reports",
	templateUrl: "./reports.component.html",
	styleUrls: ["./reports.component.css"]
})
export class ReportsComponent implements OnInit {
	public selectedTab = 0;
	private tabSwitchSubscription: Subscription;

	constructor(private reportsService: ReportsService, private application: ApplicationService) {
		this.application.subTitle = "Reports";
	}

	ngOnInit() {
		this.tabSwitchSubscription = this.reportsService.searchModel$.subscribe(() => {
			this.selectedTab = 0;
		});
	}

	public OnDestroy() {
		this.tabSwitchSubscription.unsubscribe();
	}
}
