import { Injectable } from "@angular/core";
import { BaseServiceDefinition } from "./base-service.definition";
import { DataProxyService } from "./data-proxy.service";
import { BehaviorSubject, EMPTY, Observable, forkJoin, throwError } from "rxjs";
import { Equipment } from "../models/queries/equipment.model";
import { map, tap, switchMap, catchError } from "rxjs/operators";
import { AssignEquipmentOrClassProcess } from "../models/process/assign-equipment-or-class.process.model";
import { EquipmentDetails } from "../models/details/equipment.details.model";
import { EquipmentLocationProcess } from "../models/process/equipment-location.process.model";
import { Activity } from "../models/queries/activity.model";
import { Isa95EquipmentService } from "./isa-95-equipment.service";
import { SettingsService } from "./settings.service";
import { Setting } from "../models/queries/setting.model";
import { EquipmentClass } from "../models/queries/equipment-class.model";
import { EquipmentOrClassProcess } from "../models/process/equipment-or-class.process.model";

import { isEqual } from "lodash-es";

@Injectable({
	providedIn: "root",
})
export class EquipmentService extends BaseServiceDefinition {
	private readonly equipmentWithActivities: Map<string, Activity[]> = new Map();

	private equipmentClassesSubject: BehaviorSubject<EquipmentClass[]> = new BehaviorSubject<
		EquipmentClass[]
	>([]);
	public equipmentsClass$ = this.equipmentClassesSubject.asObservable();

	private equipmentsSubject: BehaviorSubject<Equipment[]> = new BehaviorSubject<Equipment[]>([]);
	public equipments$ = this.equipmentsSubject.asObservable();

	private equipmentsWithoutClassSubject: BehaviorSubject<Equipment[]> = new BehaviorSubject<
		Equipment[]
	>([]);
	public equipmentsWithoutClass$ = this.equipmentsWithoutClassSubject.asObservable();

	private downtimesEquipmentsSubject: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(
		[]
	);
	public downtimesEquipments$ = this.downtimesEquipmentsSubject.asObservable();

	private focusedNodesSubject: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
	public focusedNodes$ = this.focusedNodesSubject.asObservable();

	private useVeri95EquipmentsLastStateOfSetting = false;

	constructor(
		private dataProxyService: DataProxyService,
		private isa95EquipmentsService: Isa95EquipmentService,
		private settingsService: SettingsService
	) {
		super();
		this.settingsService.masterdataSettings$.subscribe((currentSettings: Setting) => {
			this.useVeri95EquipmentsLastStateOfSetting = currentSettings.useveri95Equipments;
			this.sync();
		});
	}

	public getById(id: number): Observable<Equipment> {
		return this.dataProxyService
			.executeService("/Equipment/getById", id)
			.pipe(map((data: any) => this.resultsFlattenAndMerge(data)[0]));
	}

	public getDetails(id: string): Observable<EquipmentDetails> {
		return this.dataProxyService
			.executeService("/Equipment/getDetails", id)
			.pipe(map((data: any) => this.resultsFlattenAndMerge(data)[0]));
	}

	public getActivitiesForEquipmentOrClass(equipmentId: string) {
		return this.dataProxyService
			.getData(
				`SELECT o.equipmentId, a.activityId, o.tenant, o.changedby, o.changedon, o.createdby, o.createdon, o.isLocationMandatory, o.shortStopTreshold
                FROM Equipment o
                JOIN o.activities ax
                JOIN ax.activity a
                WHERE o.equipmentId.id = '${equipmentId}'
                AND a.isActive = true`
			)
			.pipe(map((data) => this.resultsFlattenAndMerge(data)));
	}

	public async getActivitiesForEquipments(equipmentIds: string[]) {
		const linesQ = equipmentIds.map((l) => `'${l}'`).join(", ");

		const activitiesForEquipmentsQuery = `SELECT DISTINCT e.equipmentId.id @equipment@, a.activityId @uiid@, a.color, a.isActive, a.isSolutionMandatory, a.isCauseMandatory, an.name, d.description, p.activityId 				@parentActivity@
			FROM Activity a
			JOIN a.equipments s
			JOIN s.equipment e
			JOIN a.names an
			LEFT JOIN a.descriptions d
			LEFT JOIN a.parentActivity p
			WHERE e.equipmentId.id IN (${linesQ})
			AND an.languageId = 'EN'
			AND a.isActive = true`;

		return this.dataProxyService.getData(activitiesForEquipmentsQuery).pipe(
			tap(async (activities: any) => {
				this.equipmentWithActivities.clear();

				for (const activity of activities) {
					const equipmentId = activity.equipment;

					if (this.equipmentWithActivities.has(equipmentId)) {
						this.setActivitiesForEquipment(equipmentId, [
							...this.equipmentWithActivities.get(equipmentId),
							activity,
						]);
					} else {
						this.setActivitiesForEquipment(equipmentId, [activity]);
					}
				}

				await this.getClassesActivitiesForEquipments(linesQ);
			})
		);
	}

	private async getClassesActivitiesForEquipments(linesQ: string) {
		await this.isa95EquipmentsService
			.getAllIsa95ClassesForEquipments(linesQ)
			.toPromise()
			.then(async (equipmentClasses: EquipmentClass[]) => {
				const classesIds = equipmentClasses.map((c) => c.id);
				const shouldGetActivitiesForClasses =
					classesIds.length > 0 &&
					!classesIds.find((e) => this.equipmentWithActivities.has(e));

				if (shouldGetActivitiesForClasses) {
					await this.getActivitiesForClasses(equipmentClasses).then(
						(actFromClasses: any) => {
							actFromClasses.forEach((actFromClass) => {
								equipmentClasses.forEach((ec) => {
									if (ec.equipmentId === actFromClass.equipment) {
										this.setActivitiesForEquipment(
											ec.equipmentId,
											actFromClass
										);
									}
								});
							});
							equipmentClasses.forEach((ec) => {
								if (!this.getActivitiesForEquipment(ec.equipmentId)) {
									actFromClasses.forEach((actFromClass) => {
										const activitiesToSet: Activity[] = [];
										actFromClass.forEach((aFC: Activity) => {
											if (ec.id === aFC.equipment) {
												aFC.equipment = ec.equipmentId;
												activitiesToSet.push(aFC);
											}
										});
										this.setActivitiesForEquipment(
											ec.equipmentId,
											activitiesToSet
										);
									});
								}
							});
						}
					);
				}
			});
	}

	private async getActivitiesForClasses(equipmentClasses: EquipmentClass[]) {
		const classesQ = equipmentClasses
			.map((c) => c.id)
			.map((l) => `'${l}'`)
			.join(", ");

		const activitiesForEquipmentsQuery = `SELECT DISTINCT e.equipmentId.id @equipment@, a.activityId @uiid@, a.color, a.isActive, a.isSolutionMandatory, a.isCauseMandatory, an.name, d.description, p.activityId 				@parentActivity@
			FROM Activity a
			JOIN a.equipments s
			JOIN s.equipment e
			JOIN a.names an
			LEFT JOIN a.descriptions d
			LEFT JOIN a.parentActivity p
			WHERE e.equipmentId.id IN (${classesQ})
			AND an.languageId = 'EN'
			AND a.isActive = true`;

		return this.dataProxyService.getData(activitiesForEquipmentsQuery).pipe(
			tap(async (activities: any) => {
				for (const activity of activities) {
					const equipmentId = activity.equipment;

					const relatedEquipmentClass = equipmentClasses.find(
						(e) => e.id === equipmentId
					);

					const existingAcivitiesForThisEquipment = this.equipmentWithActivities.get(
						relatedEquipmentClass.equipmentId
					);

					let existingSimilar;
					if (existingAcivitiesForThisEquipment) {
						existingSimilar = existingAcivitiesForThisEquipment.find(
							(a) => activity.name === a.name
						);
					}

					if (
						!existingSimilar &&
						relatedEquipmentClass &&
						this.equipmentWithActivities.has(relatedEquipmentClass.equipmentId)
					) {
						activity.equipment = relatedEquipmentClass.equipmentId;
						this.setActivitiesForEquipment(relatedEquipmentClass.equipmentId, [
							...this.equipmentWithActivities.get(relatedEquipmentClass.equipmentId),
							activity,
						]);
					}
				}
			})
		);
	}

	private setActivitiesForEquipment(equipmentId: string, activities: Activity[]) {
		this.equipmentWithActivities.set(equipmentId, activities);
	}

	public getActivitiesForEquipment(equipmentId: string) {
		return this.equipmentWithActivities.get(equipmentId);
	}

	private getAllEquipments(forceFetch: boolean = false) {
		let request: any;

		if (this.useVeri95EquipmentsLastStateOfSetting) {
			request = [this.isa95EquipmentsService.getAllIsa95Equipments()];
		} else {
			request = [
				this.dataProxyService.getData(
					`SELECT e.equipmentId.id @id@, CASE WHEN count(a) > 0 THEN true ELSE false END @hasEquipment@
					FROM Equipment e
					JOIN e.activities a
					WHERE e.equipmentId.type = 'EQUIPMENT'
					GROUP BY e.equipmentId.id`
				),
				this.dataProxyService.getData(
					"SELECT count(e.equipmentId) @totalcount@ FROM Equipment e WHERE e.equipmentId.type = 'EQUIPMENT'"
				),
			];
		}

		forkJoin(request)
			.pipe(map((data) => this.resultsFlattenAndMerge(data)))
			.subscribe(
				(data) => {
					if (!isEqual(this.equipmentsSubject.value, data) || forceFetch) {
						this.equipmentsSubject.next(data);
					}
				},
				(err) => {
					return EMPTY;
				}
			);
	}

	private getAllEquipmentClasses() {
		let request: any;

		if (this.useVeri95EquipmentsLastStateOfSetting) {
			request = [this.isa95EquipmentsService.getAllIsa95EquipmentClasses()];
		} else {
			request = [
				this.dataProxyService.getData(
					`SELECT e.equipmentId.id @id@, CASE WHEN count(a) > 0 THEN true ELSE false END @hasEquipment@
					FROM Equipment e
					JOIN e.activities a
					WHERE e.equipmentId.type = 'EQUIPMENTCLASS'
					GROUP BY e.equipmentId.id`
				),
				this.dataProxyService.getData(
					"SELECT count(e.equipmentId) @totalcount@ FROM Equipment e WHERE e.equipmentId.type = 'EQUIPMENTCLASS'"
				),
			];
		}

		forkJoin(request)
			.pipe(map((data) => this.resultsFlattenAndMerge(data)))
			.subscribe(
				(data) => {
					if (!isEqual(this.equipmentClassesSubject.value, data)) {
						this.equipmentClassesSubject.next(data);
					}
				},
				(err) => {
					return EMPTY;
				}
			);
	}

	public getAssociationByEquipmentIdAndActivityId(equipmentId: string, activityId: number) {
		return this.dataProxyService
			.getData(
				`SELECT o FROM EquipmentAssociation o
                JOIN o.activity a
                JOIN o.equipment e
                WHERE a.activityId = ${activityId}
                AND e.equipmentId.id = '${equipmentId}'`
			)
			.pipe(map((data) => this.resultsFlattenAndMerge(data.resultSet)));
	}

	public saveActivityAssociation(equipmentOrClass: AssignEquipmentOrClassProcess) {
		return this.dataProxyService.executeService(
			"/EquipmentAssociation/process",
			equipmentOrClass
		);
	}

	public removeActivityAssociation(id: number) {
		return this.dataProxyService.executeService("/EquipmentAssociation/remove", id);
	}

	public saveLocation(locationProcess: EquipmentLocationProcess) {
		return this.dataProxyService.executeService("/Location/process", locationProcess);
	}

	public removeLocation(id: number) {
		return this.dataProxyService.executeService("/Location/remove", id);
	}

	public createEquipmentForIsa95EquipmentClass(id: string) {
		const processInput = new AssignEquipmentOrClassProcess();
		processInput.equipmentId = { id, type: "EQUIPMENTCLASS" };
		return this.dataProxyService.executeService("/Equipment/process", processInput);
	}

	public createEquipmentForIsa95Equipment(id: string) {
		const processInput = new AssignEquipmentOrClassProcess();
		processInput.equipmentId = { id, type: "EQUIPMENT" };
		return this.dataProxyService.executeService("/Equipment/process", processInput);
	}

	public getEqupimentsInDowntimes(offset?: number, limit?: number) {
		this.dataProxyService
			.getData(`select DISTINCT e.equipment.equipmentId @id@ FROM Downtime e`, offset, limit)
			.pipe(map((d) => d.map((de) => de.id.replace("EQUIPMENT_", ""))))
			.subscribe((dttEquipments) => {
				this.downtimesEquipmentsSubject.next(dttEquipments);
			});
	}

	public addEquipmentOrClass(model: EquipmentOrClassProcess) {
		return this.dataProxyService.executeService("/Equipment/process", model);
	}

	public getIsa95EquipmentsWithoutClass() {
		this.getEquipmentIds().then((ids: string) => {
			this.isa95EquipmentsService
				.getIsa95EquipmentsWithoutClass(ids)
				.subscribe((ewc: Equipment[]) => {
					this.equipmentsWithoutClassSubject.next(ewc);
				});
		});
	}

	public getIsa95EquipmentsForClassId(id: string) {
		return this.isa95EquipmentsService.getIsa95EquipmentsForClassId(id);
	}

	public async getEquipmentIds(): Promise<String> {
		let result;
		await this.dataProxyService
			.getData(
				`SELECT o.equipmentId.id FROM Equipment o WHERE o.equipmentId.type = 'EQUIPMENT'`
			)
			.toPromise()
			.then((ids: any[]) => {
				result = ids.map((l) => `"${l.equipmentId}"`).join(", ");
			});

		return result;
	}

	public sync() {
		this.getAllEquipmentClasses();
		this.getAllEquipments(true);

		if (this.useVeri95EquipmentsLastStateOfSetting) {
			this.getIsa95EquipmentsWithoutClass();
		}
	}
}
