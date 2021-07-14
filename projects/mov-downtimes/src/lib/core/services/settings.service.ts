import { Injectable } from "@angular/core";
import { BaseServiceDefinition } from "./base-service.definition";
import { DataProxyService } from "./data-proxy.service";
import { SimpleSetting, SettingEnum, Setting } from "../models/queries/setting.model";
import { map, mergeMap } from "rxjs/operators";
import { from, Subject } from "rxjs";

@Injectable({
	providedIn: "root"
})
export class SettingsService extends BaseServiceDefinition {
	private masterdataSettingsSubject: Subject<Setting> = new Subject();
	public masterdataSettings$ = this.masterdataSettingsSubject.asObservable();

	constructor(private dataProxyService: DataProxyService) {
		super();
	}

	public sync(offset?: number, limit?: number) {
		this.dataProxyService
			.getData(
				`SELECT d.customizingId, d.customizingValue FROM GeneralCustomizing d`,
				offset,
				limit
			)
			.pipe(
				map((data: SimpleSetting[]) => {
					const settingFlat: Setting = {} as Setting;
					for (const d of data) {
						if (d.customizingId in SettingEnum) {
							try {
								settingFlat[d.customizingId] = JSON.parse(d.customizingValue);
							} catch {
								settingFlat[d.customizingId] = d.customizingValue;
							}
						}
					}

					return settingFlat;
				})
			)
			.subscribe((data: Setting) => {
				this.masterdataSettingsSubject.next(data);
			});
	}

	public update(setting: Setting) {
		const keys = Object.keys(setting);
		return from(keys).pipe(
			mergeMap((k: string) => {
				const body: SimpleSetting = {
					customizingId: k,
					customizingValue: setting[k]
				};

				return this.sendHttpRequests(body);
			})
		);
	}

	private sendHttpRequests(body: SimpleSetting) {
		return this.dataProxyService.executeService(
			"/GeneralCustomizing/update",
			JSON.stringify(body)
		);
	}
}
