import { DataProxyService } from "./data-proxy.service";
import { Activity } from "../models/queries/activity.model";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, forkJoin, EMPTY, Subject } from "rxjs";
import { TreeNode } from "../interfaces/TreeNode";
import { map } from "rxjs/operators";
import { BaseServiceDefinition } from "./base-service.definition";
import { ActivityDetails } from "../models/details/activity.details";
import { ActivityProcess } from "../models/process/activity.process";
import { LanguageCodes } from "../enums/language-codes.enum";
import { Solution } from "../models/queries/solution.model";
import { Cause } from "../models/queries/cause.model";
import { ColorService, ActivityWithTextColor } from "./color.service";

@Injectable({
	providedIn: "root"
})
export class ActivitiesService extends BaseServiceDefinition {
	private rootActivitiesSubject: BehaviorSubject<Activity[]> = new BehaviorSubject<Activity[]>(
		[]
	);
	public rootActivities$ = this.rootActivitiesSubject.asObservable();

	private refreshTreeSubject: Subject<any> = new Subject();
	public refreshTree$ = this.refreshTreeSubject.asObservable();

	private clearFocusSubject: Subject<any> = new Subject();
	public clearFocus$ = this.clearFocusSubject.asObservable();

	private focusedNodesSubject: Subject<string[]> = new Subject<string[]>();
	public focusedNodes$ = this.focusedNodesSubject.asObservable();

	constructor(private dataProxyService: DataProxyService, private colorService: ColorService) {
		super();
	}

	public refreshTree() {
		this.refreshTreeSubject.next();
	}

	public clearFocus() {
		this.clearFocusSubject.next();
	}

	public focusNodes(specificNodes: string[]) {
		this.focusedNodesSubject.next(specificNodes);
	}

	public getById(id: number): Observable<ActivityDetails> {
		return this.dataProxyService
			.executeService("/Activity/getById", id)
			.pipe(map((data: any) => this.resultsFlattenAndMerge(data)[0]));
	}

	public getDetails(id: number): Observable<ActivityDetails> {
		return this.dataProxyService
			.executeService("/Activity/getDetails", id)
			.pipe(map((data: any) => this.resultsFlattenAndMerge(data)[0]));
	}

	public getByParentId(id: number, languageCode: string) {
		return forkJoin([
			this.dataProxyService.getData(
				`SELECT  a.activityId @uiid@, a.color, a.allowance, a.maximumAllowance, a.automatedCode, a.sapPMCode,
            a.sapDowntimeCode, a.isActive, a.isSolutionMandatory, a.isCauseMandatory,
            n.name, @nested@ (SELECT s.activityId FROM Activity s WHERE s.activityId = a.activityId AND size(s.nestedActivities) > 0)
            FROM Activity a
            LEFT JOIN a.names n
            WHERE a.parentActivity.activityId = ${id}
            AND n.languageId = '${languageCode}'`
			)
		]).pipe(map(data => this.resultsFlattenAndMerge(data)));
	}

	public getRootActivities(languageCode: string) {
		forkJoin([
			this.dataProxyService.getData(
				`SELECT  a.activityId @uiid@, a.color, a.allowance, a.maximumAllowance, a.automatedCode, a.sapPMCode,
                a.sapDowntimeCode, a.isActive, a.isSolutionMandatory, a.isCauseMandatory,
                n.name, @nested@ (SELECT s.activityId FROM Activity s WHERE s.activityId = a.activityId AND size(s.nestedActivities) > 0)
                FROM Activity a
                LEFT JOIN a.names n
                WHERE a.parentActivity IS NULL
                AND n.languageId = '${languageCode}'`
			)
		])
			.pipe(map(data => this.resultsFlattenAndMerge(data)))
			.subscribe(
				data => {
					this.rootActivitiesSubject.next(data);
				},
				err => {
					return EMPTY;
				}
			);
	}

	public getAll(languageCode: string, offset?: number, limit?: number): Observable<Activity[]> {
		return this.dataProxyService.getData(
			`SELECT  a.activityId @uiid@, a.color, a.allowance, a.maximumAllowance, a.automatedCode, a.sapPMCode,
            a.sapDowntimeCode, a.isActive, a.isSolutionMandatory, a.isCauseMandatory, p.activityId @parentActivity@,
            n.name
            FROM Activity a
            LEFT JOIN a.names n
            LEFT JOIN a.parentActivity p
            WHERE n.languageId = '${languageCode}'`,
			offset,
			limit
		);
	}

	public getCausesForActivity(
		activityId: string,
		languageId?: LanguageCodes,
		offset?: number,
		limit?: number
	): Observable<Cause[]> {
		languageId = languageId || LanguageCodes.English;
		return this.dataProxyService
			.getData(
				`SELECT a.activityId, c.causeId @uiid@, n.name
            FROM Activity a JOIN a.causes cs JOIN cs.cause c JOIN c.names n WHERE n.languageId = '${languageId}' AND a.activityId = '${activityId}'`,
				offset,
				limit
			)
			.pipe(map(data => this.resultsFlattenAndMerge(data)));
	}

	public getSolutionsForActivity(
		activityId: string,
		languageId?: LanguageCodes,
		offset?: number,
		limit?: number
	): Observable<Solution[]> {
		languageId = languageId || LanguageCodes.English;
		return this.dataProxyService
			.getData(
				`SELECT a.activityId, s.solutionId @uiid@, n.name
                FROM Activity a JOIN a.solutions ss JOIN ss.solution s JOIN s.names n WHERE n.languageId = '${languageId}' AND a.activityId = '${activityId}'`,
				offset,
				limit
			)
			.pipe(map(data => this.resultsFlattenAndMerge(data)));
	}

	public getActivityWithTextColor(ac: Activity) {
		const rgb = this.colorService.hexToRgb(ac.color);
		let textColor = "black";

		if (rgb) {
			const colorVal = Math.round((rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000);

			if (colorVal <= 125) {
				textColor = "white";
			}
		}

		return {
			...ac,
			textColor: textColor
		} as ActivityWithTextColor;
	}

	public sync(languageCode: string) {
		this.getRootActivities(languageCode);
	}

	public addActivity(activity: ActivityDetails) {
		const createUpdateActivity = new ActivityProcess();
		createUpdateActivity.fromDetails(activity);
		return this.dataProxyService.executeService(
			"/Activity/process?cacheBuster=1.0.1",
			createUpdateActivity
		);
	}

	public delete(id: string) {
		this.dataProxyService.executeService("Activity/remove", id);
	}

	public getActivitiesAsTreeNodes(activities: Activity[]) {
		const treeNodes: TreeNode[] = [];

		if (Array.isArray(activities)) {
			for (const activity of activities) {
				if (activity && activity.uiid) {
					const hasChildren = +activity.nested > 0;

					let activityIsActive = true;
					if (activity.isActive === "false") {
						activityIsActive = false;
					}

					treeNodes.push({
						id: +activity.uiid,
						name: activity.name,
						isActive: activityIsActive,
						color: activity.color,
						hasChildren,
						visible: true
					});
				}
			}
		}

		return treeNodes;
	}
}
