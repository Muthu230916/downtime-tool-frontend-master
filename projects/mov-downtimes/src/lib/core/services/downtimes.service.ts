import { Injectable } from "@angular/core";
import { DataProxyService } from "./data-proxy.service";
import { Observable, forkJoin, throwError } from "rxjs";
import { Downtime } from "../models/queries/downtime.model";
import { map, catchError, switchMap } from "rxjs/operators";
import { LanguageCodes } from "../enums/language-codes.enum";
import { DowntimeProcess } from "../models/process/downtime.process.model";
import { DateTimeService } from "./date-time.service";
import { EquipmentService } from "./equipment.service";

@Injectable({
	providedIn: "root",
})
export class DowntimesService {
	constructor(
		private dataProxyService: DataProxyService,
		private dateTimeService: DateTimeService,
		private equipmentService: EquipmentService
	) {}

	/**
	 * 'from' and 'until' takes string should be as ISO date string
	 */
	public async getByLine(
		lines: string[],
		from?: string,
		until?: string,
		offset?: number,
		limit?: number
	): Promise<Observable<Downtime>> {
		until = until || new Date().toISOString();
		from = from || "2011-11-30T22:47:34.000Z";

		// Query needs the equipments to be seperated by comma and also inside apostrophes ''
		const linesQ = lines.map((l) => `'${l}'`).join(", ");

		const downtimeItemsQuery = `SELECT d.downtimeId @uiid@, d.isSplit, d.isShortStop, d.batch, d.startTime, d.endTime, d.duration, c.causeId, cn.name @causeName@,
		s.solutionId, sn.name @solutionName@, t.teamId, tn.name @teamName@, e.equipmentId.id @equipmentId@, e.equipmentId.type @type@, e.shortStopTreshold @shortStop@, ln.name @location@, a.activityId, la.name @activityName@,
		d.batch, d.order
		FROM Downtime d
		LEFT JOIN d.activity a
		LEFT JOIN a.names la
		LEFT JOIN d.equipment e
		LEFT JOIN d.cause c
		LEFT JOIN c.names cn
		LEFT JOIN d.solution s
		LEFT JOIN s.names sn
		LEFT JOIN d.team t
		LEFT JOIN t.names tn
		LEFT JOIN d.location l
		LEFT JOIN l.names ln
		WHERE e.equipmentId.id IN ( ${linesQ} ) AND (( d.startTime BETWEEN {nwts '${from}'}
        AND {nwts '${until}'}) OR (a.activityId IS NULL OR a.activityId IS NOT NULL) ) AND ( cn.languageId = 'EN' OR cn.languageId IS NULL)
        AND ( sn.languageId = 'EN' OR sn.languageId IS NULL) AND ( ln.languageId = 'EN' OR ln.languageId IS NULL) AND ( la.languageId = 'EN' OR la.languageId IS NULL)
        AND (d.isShortStop = 'false' OR d.isShortStop IS NULL OR d.isShortStop = 'true') AND ( tn.languageId='EN' OR tn.languageId IS NULL) ORDER BY d.startTime DESC`;

		const totalCountQuery = `SELECT COUNT(d.downtimeId) @totalCount@
		FROM Downtime d
		LEFT JOIN d.activity a
		LEFT JOIN a.names la
		LEFT JOIN d.equipment e
		LEFT JOIN d.cause c
		LEFT JOIN c.names cn
		LEFT JOIN d.solution s
		LEFT JOIN s.names sn
		LEFT JOIN d.team t
		LEFT JOIN d.location l
		LEFT JOIN l.names ln
		WHERE e.equipmentId.id IN ( ${linesQ} )
        AND (( d.startTime BETWEEN {nwts '${from}'} AND {nwts '${until}'}) OR (a.activityId IS NULL OR a.activityId IS NOT NULL) )
        AND ( cn.languageId = 'EN' OR cn.languageId IS NULL) AND ( sn.languageId = 'EN' OR sn.languageId IS NULL) AND ( ln.languageId = 'EN' OR ln.languageId IS NULL)
        AND ( la.languageId = 'EN' OR la.languageId IS NULL) AND (d.isShortStop = 'false' OR d.isShortStop IS NULL OR d.isShortStop = 'true')`;

		return (await this.equipmentService.getActivitiesForEquipments(lines)).pipe(
			switchMap(() => {
				return forkJoin({
					downtimeItems: this.dataProxyService.getData(downtimeItemsQuery, offset, limit),
					totalCount: this.dataProxyService.getData(totalCountQuery).pipe(
						map((totalCount: any[]) => {
							return +totalCount[0].totalCount;
						})
					),
				}).pipe(
					map(
						(data) =>
							new Downtime(this.dateTimeService, data.downtimeItems, data.totalCount)
					),
					catchError((e) => throwError(e))
				);
			})
		);
	}

	public declareDowntime(downtime: DowntimeProcess) {
		return this.dataProxyService.executeService(
			"/Downtime/process?cacheBuster=1.0.0",
			downtime
		);
	}

	public updateDowntime(downtime: DowntimeProcess) {
		return this.dataProxyService.executeService("/Downtime/update", downtime);
	}

	public getLocationsByEquipment(
		equipmentId: string,
		languageId?: LanguageCodes,
		offset?: number,
		limit?: number
	) {
		languageId = languageId || LanguageCodes.English;
		return this.dataProxyService.getData(
			`SELECT e.equipmentId.id, n.name, l.locationId @uiid@
        FROM Equipment e JOIN e.locations l JOIN l.names n WHERE e.equipmentId.id = '${equipmentId}' AND n.languageId = '${languageId}'`,
			offset,
			limit
		);
	}
}
