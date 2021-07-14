import { Injectable } from "@angular/core";
import { BaseServiceDefinition } from "./base-service.definition";
import { DataProxyService } from "./data-proxy.service";
import { BehaviorSubject, forkJoin, EMPTY } from "rxjs";
import { Cause } from "../models/queries/cause.model";
import { map } from "rxjs/operators";
import { CauseProcess } from "../models/process/cause.process.model";
import { Localization } from "../interfaces/localization";

@Injectable({
	providedIn: "root"
})
export class CausesService extends BaseServiceDefinition {
	constructor(private dataProxyService: DataProxyService) {
		super();
	}

	private allSubject: BehaviorSubject<Cause[]> = new BehaviorSubject<Cause[]>([]);
	public all$ = this.allSubject.asObservable();

	public getAll(languageCode: string, offset?: number, limit?: number) {
		forkJoin([
			this.dataProxyService.getData(
				`SELECT o.causeId @uiid@, n.name, o.createdon
                FROM Cause o
                LEFT JOIN o.names n
                WHERE n.languageId = '${languageCode}'`,
				offset,
				limit
			)
		])
			.pipe(map(data => this.resultsFlattenAndMerge(data)))
			.subscribe(
				data => {
					this.allSubject.next(data);
				},
				() => {
					return EMPTY;
				}
			);
	}

	public save(model: CauseProcess) {
		return this.dataProxyService.executeService("/Cause/process", model);
	}

	public remove(id: number) {
		return this.dataProxyService.executeService("/Cause/remove", id);
	}

	public get(id: number) {
		return forkJoin([
			this.dataProxyService.getData(
				`SELECT o.causeId @uiid@, n.name, n.createdon, n.languageId
                FROM Cause o
                LEFT JOIN o.names n
                WHERE o.causeId = '${id}'`
			)
		]).pipe(map(data => this.resultsFlattenAndMerge(data)));
	}

	public async causeToUpdateObject(cause: Cause) {
		let causeAllData: any[];

		await this.get(+cause.uiid)
			.toPromise()
			.then(data => {
				causeAllData = data;
			});

		const causeToUpdate = new CauseProcess();
		causeToUpdate.causeId = +cause.uiid;

		for (const data of causeAllData) {
			const translation: Localization = {
				languageId: data.languageId,
				name: data.name
			};
			causeToUpdate.names.push(translation);
		}

		return causeToUpdate;
	}

	public getDetails(id: number) {
		return this.dataProxyService.executeService("/Cause/getDetails", id);
	}
}
