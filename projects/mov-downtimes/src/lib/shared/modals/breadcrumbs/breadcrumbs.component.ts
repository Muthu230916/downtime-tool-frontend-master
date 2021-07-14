import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from "@angular/core";
import { Activity } from "../../../core/models/queries/activity.model";
import { Observable, Subscription } from "rxjs";
import { ActivityWithTextColor } from "../../../core/services/color.service";
import { ActivitiesService } from "../../../core/services/activities.service";

@Component({
	selector: "lib-downtimes-breadcrumbs",
	templateUrl: "./breadcrumbs.component.html",
	styleUrls: ["./breadcrumbs.component.css"],
})
export class BreadcrumbsComponent implements OnInit, OnDestroy {
	@Input() lastBreadcrumbName?: string;
	@Input() lastBreadcrumbName$: Observable<string>;
	@Input() breadcrumbs: Activity[];
	private breadcrumbsWithTextColor: ActivityWithTextColor[];

	// tslint:disable-next-line: no-output-on-prefix
	@Output() onBreadcrumbClick = new EventEmitter<Activity>();

	public breadcrumbNameSubscription: Subscription;

	public breadcrumbsToShow = [];

	constructor(private activitesService: ActivitiesService) {}

	ngOnInit() {
		if (this.breadcrumbs) {
			this.breadcrumbsWithTextColor = this.breadcrumbs.map((ac) =>
				this.activitesService.getActivityWithTextColor(ac)
			);

			if (this.lastBreadcrumbName) {
				this.searchForNode();
			} else {
				this.breadcrumbNameSubscription = this.lastBreadcrumbName$.subscribe((name) => {
					this.lastBreadcrumbName = name;
					this.searchForNode();
				});
			}
		}
	}

	private searchForNode() {
		this.breadcrumbsToShow = [];

		if (this.lastBreadcrumbName === "undeclared") {
			return;
		}

		const node = this.breadcrumbsWithTextColor.find((b) => b.name === this.lastBreadcrumbName);

		if (node) {
			this.breadcrumbsToShow.push(node);

			let parentNode = this.breadcrumbsWithTextColor.find(
				(b) => b.uiid === node.parentActivity
			);

			if (parentNode) {
				let hasParent = parentNode.parentActivity !== "0";
				this.breadcrumbsToShow.push(parentNode);

				while (hasParent) {
					parentNode = this.breadcrumbsWithTextColor.find(
						(b) => b.uiid === (parentNode ? parentNode.parentActivity : undefined)
					);

					if (parentNode) {
						this.breadcrumbsToShow.push(parentNode);
						hasParent = parentNode.parentActivity !== "0";
					} else {
						break;
					}
				}
			}
			this.breadcrumbsToShow.reverse();
		}
	}

	public breadcrumbClick(breadcrumb: Activity) {
		this.onBreadcrumbClick.emit(breadcrumb);
	}

	public ngOnDestroy() {
		if (this.breadcrumbNameSubscription) {
			this.breadcrumbNameSubscription.unsubscribe();
		}
	}
}
