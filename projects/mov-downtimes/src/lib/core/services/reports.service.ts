import moment from "moment";
import { Injectable } from "@angular/core";
import { BaseServiceDefinition } from "./base-service.definition";
import { DataProxyService } from "./data-proxy.service";
import { map } from "rxjs/operators";
import { forkJoin, BehaviorSubject, Subject } from "rxjs";
import { ReportsSearchModel } from "../models/reports-search.model";
import { ShowDowntimeItem } from "../models/queries/downtime.model";
import {
	StatisticsContainerModel,
	StatisticsModel,
} from "../models/queries/statistics-container.model";
import { DateTimeService } from "./date-time.service";

@Injectable({
	providedIn: "root",
})
export class ReportsService extends BaseServiceDefinition {
	private searchModelSubject: BehaviorSubject<ReportsSearchModel> = new BehaviorSubject<
		ReportsSearchModel
	>(new ReportsSearchModel());
	public searchModel$ = this.searchModelSubject.asObservable();

	private calculateAllChartsSubject: Subject<undefined> = new Subject<undefined>();
	public calculateAllCharts$ = this.calculateAllChartsSubject.asObservable();

	constructor(
		private dataProxyService: DataProxyService,
		private dateTimeService: DateTimeService
	) {
		super();
	}

	public calculateAllCharts() {
		this.calculateAllChartsSubject.next();
	}

	public getAll(
		languageCode: string,
		searchModel: ReportsSearchModel,
		offset: number,
		limit: number
	) {
		let activityFieldsForDeclared = "a.activityId, la.name @activityName@,";
		let activityJoinNamesForDeclared = "LEFT JOIN d.activity a LEFT JOIN a.names la";
		let activityConditionNamesForDeclared = `AND ( la.languageId = '${languageCode}' OR la.languageId IS NULL)`;

		if (searchModel.showUndeclared) {
			activityFieldsForDeclared = "";
			activityJoinNamesForDeclared = "";
			activityConditionNamesForDeclared = "";
		}
		return forkJoin([
			this.dataProxyService.getData(
				`SELECT d.downtimeId @uiid@, d.isSplit, d.isShortStop, d.batch, d.startTime, d.endTime, d.duration, c.causeId, cn.name @causeName@, d.causeComment @causeComment@,
                s.solutionId, sn.name @solutionName@,d.solutionComment @solutionComment@, t.teamId, tn.name @teamName@, e.equipmentId.id @equipmentId@,
				e.equipmentId.type @type@, e.shortStopTreshold @shortStop@, ln.name @location@,  ${activityFieldsForDeclared} d.changedby @user@,
				d.batch, d.order
                FROM Downtime d
                ${activityJoinNamesForDeclared}
                LEFT JOIN d.equipment e
                LEFT JOIN d.cause c
                LEFT JOIN c.names cn
                LEFT JOIN d.solution s
                LEFT JOIN s.names sn
                LEFT JOIN d.team t
                LEFT JOIN t.names tn
                LEFT JOIN d.location l
                LEFT JOIN l.names ln
                WHERE ${searchModel.getEquipmentsSubQuery()} ${searchModel.getFiltersSubQuery()}
                AND ${searchModel.getDateTimePeriodSubQuery()}
                AND ( d.isShortStop = '${searchModel.showShortStop}' OR d.isShortStop IS NULL )
                AND ( cn.languageId = '${languageCode}' OR cn.languageId IS NULL)
                AND ( sn.languageId = '${languageCode}' OR sn.languageId IS NULL)
                AND ( ln.languageId = '${languageCode}' OR ln.languageId IS NULL)
                ${activityConditionNamesForDeclared}
                ORDER BY d.startTime DESC`,
				offset,
				limit
			),
		])
			.pipe(map((data) => this.resultsFlattenAndMerge(data)))
			.pipe(
				map((data) =>
					data.map((i) => {
						let Duration = "";

						if (i.endTime !== "") {
							const momentDuration = moment.duration(+i.duration, "seconds");

							Duration = this.dateTimeService.toDurationString(momentDuration);
						}
						return {
							ID: i.uiid,
							Activity: +i.activityId > 0 ? i.activityName : "undeclared",
							Duration,
							Start: i.startTime,
							Stop: i.endTime,
							Team: +i.teamId > 0 ? i.teamName : "",
							isDeclared: +i.activityId > 0 ? true : false,
							WorkCenter: i.equipmentId,
							batch: i.batch,
							order: i.order,
							causeName: i.causeName,
							causeComment: i.causeComment,
							solutionName: i.solutionName,
							solutionComment: i.solutionComment,
							User: i.user,
							activityId: i.activityId,
						} as ShowDowntimeItem;
					})
				)
			);
	}

	public getTotalCount(languageCode: string, searchModel: ReportsSearchModel) {
		let activityJoinNamesForDeclared = "LEFT JOIN d.activity a LEFT JOIN a.names la";
		let activityConditionNamesForDeclared = `AND ( la.languageId = '${languageCode}' OR la.languageId IS NULL)`;

		if (searchModel.showUndeclared) {
			activityJoinNamesForDeclared = "";
			activityConditionNamesForDeclared = "";
		}
		return forkJoin([
			this.dataProxyService.getData(
				`SELECT count(d.downtimeId) @totalCount@
                FROM Downtime d
                ${activityJoinNamesForDeclared}
                LEFT JOIN d.equipment e
                LEFT JOIN d.cause c
                LEFT JOIN c.names cn
                LEFT JOIN d.solution s
                LEFT JOIN s.names sn
                LEFT JOIN d.team t
                LEFT JOIN t.names tn
                LEFT JOIN d.location l
                LEFT JOIN l.names ln
                WHERE ${searchModel.getEquipmentsSubQuery()} ${searchModel.getFiltersSubQuery()}
                AND ${searchModel.getDateTimePeriodSubQuery()}
                AND ( d.isShortStop = '${searchModel.showShortStop}' OR d.isShortStop IS NULL )
                AND ( cn.languageId = '${languageCode}' OR cn.languageId IS NULL)
                AND ( sn.languageId = '${languageCode}' OR sn.languageId IS NULL)
                AND ( ln.languageId = '${languageCode}' OR ln.languageId IS NULL)
                ${activityConditionNamesForDeclared}`
			),
		]).pipe(map((data) => this.resultsFlattenAndMerge(data)));
	}

	public getViews() {
		return forkJoin([
			this.dataProxyService.getData(
				`SELECT r.reportId @uiid@,
                    r.name @NAME@,
                    r.createdby @CREATED_BY@,
                    r.createdon @CREATED_ON@,
                    r.type @TYPE@,
                    r.isShared @IS_SHARED@
                FROM Report R`
			),
		])
			.pipe(map((data) => this.resultsFlattenAndMerge(data)))
			.pipe(
				map((data) =>
					data.map((result) => {
						return {
							uiid: result.uiid,
							name: result.NAME,
							createdOn: result.CREATED_ON,
							createdBy: result.CREATED_BY,
							shared: result.IS_SHARED,
							type: result.TYPE,
						} as StatisticsContainerModel;
					})
				)
			);
	}

	public getViewGauges(id: string) {
		return forkJoin([
			this.dataProxyService.getData(
				`SELECT r.content FROM Report R WHERE r.reportId = '${id}'`,
				0,
				1
			),
		])
			.pipe(map((data) => this.resultsFlattenAndMerge(data)))
			.pipe(
				map((data) =>
					data.map((result) => {
						return this.getParsedReportContent(result.content);
					})
				)
			);
	}

	private getParsedReportContent(content: string): StatisticsModel[] {
		if (!content) {
			return [];
		}

		const parsedJson = JSON.parse(content) as any[];

		// adjust retrieved data so we keep only the parts relevant to us
		// this should be a no-op unless we are retrieving data migrated from the old AngularJS downtimes
		return parsedJson.map((statisticsObject) => {
			const statisticsSelection = statisticsObject.selection;

			return {
				selection: {
					dateFrom: statisticsSelection.dateFrom,
					dateTo: statisticsSelection.dateTo,
					equipments: statisticsSelection.equipments,
					activity: statisticsSelection.activity,
					timeFilterType: "DATE", // we do not support the shift option from the old AngularJS downtimes
					dynamicDaily: statisticsSelection.dynamicDaily
						? statisticsSelection.dynamicDaily
						: undefined,
					dynamicWeekly: statisticsSelection.dynamicWeekly
						? statisticsSelection.dynamicWeekly
						: undefined,
				},
			};
		});
	}

	public saveView(model: StatisticsContainerModel) {
		const customModel = {
			reportId: model.uiid ? model.uiid : undefined,
			name: model.name,
			type: model.type,
			shared: model.shared,
			content: JSON.stringify(model.gauges),
		};
		return this.dataProxyService.executeService("/Report/process", customModel);
	}

	public deleteView(id: string) {
		return this.dataProxyService.executeService("/Report/remove", id);
	}

	public setSearchModel(searchModel: ReportsSearchModel) {
		this.searchModelSubject.next(searchModel);
	}
}
