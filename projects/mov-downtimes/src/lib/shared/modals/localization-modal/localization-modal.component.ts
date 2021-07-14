import { Component, OnInit, OnDestroy, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Localization } from "../../../core/interfaces/localization";
import { LanguageCodes } from "../../../core/enums/language-codes.enum";
import { LocalizationModalConfig } from "../../../core/interfaces/localization-modal-config";

@Component({
	selector: "lib-downtimes-localization-modal",
	templateUrl: "./localization-modal.component.html",
	styleUrls: ["./localization-modal.component.css"]
})
export class LocalizationModalComponent implements OnInit, OnDestroy {
	public title = "Add new ";
	public languageCodes = Object.keys(LanguageCodes).map(key => ({
		code: LanguageCodes[key],
		name: key
	}));

	constructor(
		public dialogRef: MatDialogRef<LocalizationModalComponent>,
		@Inject(MAT_DIALOG_DATA) public model: LocalizationModalConfig
	) {
		if (!model.data || (model.data && model.data.length === 0)) {
			this.model.data = [];
			this.model.data.push({ languageId: LanguageCodes.English, name: "" } as Localization);
			this.title += this.model.subjectTitle;
		} else {
			const localized = this.model.data.find(
				translation => translation.languageId === LanguageCodes.English
			);

			if (localized) {
				this.title = "Update " + this.model.subjectTitle + ": " + localized.name;
			} else {
				this.title = "Update " + this.model.subjectTitle;
			}
		}
	}

	public addLocalization() {
		if (this.model.data.length <= this.languageCodes.length - 1) {
			this.model.data.push({ languageId: undefined, name: "" } as Localization);
		}
	}

	public onCancel() {
		this.dialogRef.close();
	}

	ngOnInit() {}

	ngOnDestroy() {}
}
