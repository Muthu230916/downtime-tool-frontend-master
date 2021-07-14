import { Component, OnInit, OnDestroy } from "@angular/core";
import { SettingsService } from "../../core/services/settings.service";
import { Setting } from "../../core/models/queries/setting.model";
import { Subscription } from "rxjs";

@Component({
	selector: "lib-downtimes-settings",
	templateUrl: "./settings.component.html",
	styleUrls: ["./settings.component.css"]
})
export class SettingsComponent implements OnInit, OnDestroy {
	public useVeri95Equipments = false;
	public useVeri95MaterialLots = false;

	public hasDowntimesForLastHours = false;
	public hasLastDowntimes = false;

	public localMasterXHours = 0;
	public localMasterXLast = 0;

	public settings!: Setting;
	private settingSubscription: Subscription;
	// private updateSubscription: Subscription;

	constructor(private settingsService: SettingsService) {}

	public refreshSettings() {
		this.settingsService.sync();
	}

	ngOnInit() {
		this.settingSubscription = this.settingsService.masterdataSettings$.subscribe(s => {
			this.settings = s;
			this.localMasterXHours = this.settings.masterXHours;
			this.localMasterXLast = this.settings.masterXLast;
			this.useVeri95Equipments = this.settings.useveri95Equipments;
			this.useVeri95MaterialLots = this.settings.useveri95MaterialLots;
		});

		this.settingsService.sync();
	}

	ngOnDestroy() {
		// if (this.updateSubscription) {
		// 	this.updateSubscription.unsubscribe();
		// }

		this.settingSubscription.unsubscribe();
	}

	public async save() {
		if (this.hasLastDowntimes && this.localMasterXHours) {
			this.settings.masterXHours = this.localMasterXHours;
		}

		if (this.hasDowntimesForLastHours && this.localMasterXLast) {
			this.settings.masterXLast = this.localMasterXLast;
		}

		this.settingsService.update(this.settings).subscribe(() => {
			this.settingsService.sync();
		});

		await this.settingsService
			.update(this.settings)
			.toPromise()
			.then(() => {
				this.settingsService.sync();
			});
	}

	public onLocationChange() {
		this.settings.masterLocation = !this.settings.masterLocation;
	}

	public onCauseChange() {
		this.settings.masterCause = !this.settings.masterCause;
	}

	public onSolutionChange() {
		this.settings.masterSolution = !this.settings.masterSolution;
	}

	public onEquipmentsSourceChange() {
		this.settings.useveri95Equipments = !this.settings.useveri95Equipments;
	}

	public onMaterialLotsSourceChange() {
		this.settings.useveri95MaterialLots = !this.settings.useveri95MaterialLots;
	}
}
