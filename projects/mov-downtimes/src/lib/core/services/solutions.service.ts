import { Injectable } from "@angular/core";
import { DataProxyService } from "./data-proxy.service";
import { BehaviorSubject, forkJoin, EMPTY } from "rxjs";
import { map } from "rxjs/operators";
import { BaseServiceDefinition } from "./base-service.definition";
import { Solution } from "../models/queries/solution.model";
import { SolutionProcess } from "../models/process/solution.process.model";
import { Localization } from "../interfaces/localization";

@Injectable({
	providedIn: "root",
})
export class SolutionsService extends BaseServiceDefinition {
	constructor(private dataProxyService: DataProxyService) {
		super();
	}

	private allSubject: BehaviorSubject<Solution[]> = new BehaviorSubject<Solution[]>([]);
	public all$ = this.allSubject.asObservable();

	public getAll(languageCode: string, offset?: number, limit?: number) {
		forkJoin([
			this.dataProxyService.getData(
				`SELECT o.solutionId @uiid@, n.name, n.createdon
                FROM Solution o
                LEFT JOIN o.names n
                WHERE n.languageId = '${languageCode}'`,
				offset,
				limit
			),
		])
			.pipe(map((data) => this.resultsFlattenAndMerge(data)))
			.subscribe(
				(data) => {
					this.allSubject.next(data);
				},
				() => {
					return EMPTY;
				}
			);
	}

	public get(id: number) {
		return forkJoin([
			this.dataProxyService.getData(
				`SELECT o.solutionId @uiid@, n.name, n.createdon, n.languageId
                FROM Solution o
                LEFT JOIN o.names n
                WHERE o.solutionId = '${id}'`
			),
		]).pipe(map((data) => this.resultsFlattenAndMerge(data)));
	}

	public async solutionToUpdateObject(cause: Solution) {
		let solutionAllData: any[];

		await this.get(+cause.uiid)
			.toPromise()
			.then((data) => {
				solutionAllData = data;
			});

		const solutionToUpdate = new SolutionProcess();
		solutionToUpdate.solutionId = +cause.uiid;

		for (const data of solutionAllData) {
			const translation: Localization = {
				languageId: data.languageId,
				name: data.name,
			};
			solutionToUpdate.names.push(translation);
		}

		return solutionToUpdate;
	}

	public save(model: SolutionProcess) {
		return this.dataProxyService.executeService("/Solution/process", model);
	}

	public remove(id: number) {
		return this.dataProxyService.executeService("/Solution/remove", id);
	}
}
