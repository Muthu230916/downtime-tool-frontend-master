import { Injectable } from "@angular/core";
import { DataProxyService } from "./data-proxy.service";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

@Injectable({
	providedIn: "root"
})
export class NamesService {
	constructor(private dataProxyService: DataProxyService) {}

	public getNameById(id: number): Observable<Name[]> {
		return this.dataProxyService
			.getData(`select n.name, n.languageId from Name n where n.languageId = '${id}'`)
			.pipe(map((data: any) => this.resultsFlattenAndMerge(data)));
	}

	private resultsFlattenAndMerge(data: [any]) {
		const formated: Name[] = [];
		const merged = [].concat.apply([], data);

		for (const name of merged) {
			if (name) {
				formated.push(name);
			}
		}

		return formated;
	}
}

interface Name {
	name: string;
	languageId: string;
}
